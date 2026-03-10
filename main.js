const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason,
    Browsers
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require("fs")
const http = require("http")
const path = require("path") // Sa a te manke a
const settings = require("./settings")

// --- SMART UPTIME SERVER ---
const startServer = (port) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('QUEEN COLAMBIA IS ONLINE');
    });
    server.listen(port, () => {
        console.log(` Sèvè aktif sou pòt: ${port}`);
    });
    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') startServer(port + 1);
    });
};
startServer(process.env.PORT || 3000);

let isPublic = true; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: Browsers.macOS("Desktop"),
        printQRInTerminal: false
    })

    // --- PAIRING CODE LOGIC ---
    if (!sock.authState.creds.registered) {
        // Netwaye nimewo a pou wete espas oswa karaktè espesyal
        const ownerPhone = settings.ownerNumber.replace(/[^0-9]/g, '')
        
        if (!ownerPhone) {
            console.log("❌ Erè: Nimewo ownerNumber la pa valid nan settings.js");
        } else {
            console.log(`\n🔄 Demand kòd pou: ${ownerPhone}...`);
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(ownerPhone)
                    code = code?.match(/.{1,4}/g)?.join("-") || code
                    console.log(`\n✅ KÒD PAIRING OU: ${code}\n`)
                } catch (err) { 
                    console.log("❌ Erè nan demand kòd la:", err.message) 
                }
            }, 6000)
        }
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log("🔄 Koneksyon koupe, m ap rekonekte...")
            if (shouldReconnect) startBot()
        } else if (connection === "open") {
            const prefix = settings.prefix || "."
            const ownerJid = settings.ownerNumber.replace(/[^0-9]/g, '') + "@s.whatsapp.net"
            
            console.log(`\n🎊 QUEEN COLAMBIA CONNECTED!\n📢 Mode: ${isPublic ? 'Public' : 'Private'}`)
            
            await sock.sendMessage(ownerJid, { 
                text: `✅ *QUEEN COLAMBIA IS ONLINE*\n\n⚙️ *Prefix:* [ ${prefix} ]\n📢 *Mode:* ${isPublic ? 'Public' : 'Private'}\n\nBot la konekte nèt kounye a!` 
            })
        }
    })

    // 📂 Auto-load commands
    const commands = {}
    const commandsPath = path.join(__dirname, "commands")
    
    if (fs.existsSync(commandsPath)) {
        fs.readdirSync(commandsPath).forEach(file => {
            if (file.endsWith(".js")) {
                try {
                    const cmd = require(path.join(commandsPath, file))
                    commands[file.replace(".js", "")] = cmd
                } catch (e) { 
                    console.log(`❌ Erè nan chaje ${file}:`, e.message) 
                }
            }
        })
    }

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== 'notify') return
        const m = messages[0]
        if (!m.message || m.key.fromMe) return // Pa reponn pwòp mesaj bot la
        
        const from = m.key.remoteJid
        const sender = m.key.participant || m.key.remoteJid
        const ownerNum = settings.ownerNumber.replace(/[^0-9]/g, '')
        const isOwner = sender.includes(ownerNum)
        
        const text = m.message.conversation || m.message.extendedTextMessage?.text || ""
        const prefix = settings.prefix || "."

        if (!text.startsWith(prefix)) return
        if (!isPublic && !isOwner) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        // Kòmand pou chanje mode (Silansye)
        if (commandName === "public" && isOwner) {
            isPublic = true
            return sock.sendMessage(from, { text: "✅ Mode kounye a: *PUBLIC*" }, { quoted: m })
        }
        if (commandName === "private" && isOwner) {
            isPublic = false
            return sock.sendMessage(from, { text: "🔒 Mode kounye a: *PRIVATE*" }, { quoted: m })
        }

        // Egzekite kòmand si li egziste
        if (commands[commandName]) {
            try {
                await commands[commandName](sock, m, args)
            } catch (err) {
                console.log(`❌ Erè nan kòmand ${commandName}:`, err)
            }
        }
    })
}

startBot().catch(err => console.log("Erè fatal:", err))
