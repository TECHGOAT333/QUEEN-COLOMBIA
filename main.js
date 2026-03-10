const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require("fs")
const http = require("http")
const settings = require("./settings")

// --- SMART UPTIME SERVER ---
const startServer = (port) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('QUEEN COLAMBIA IS ONLINE');
    });
    server.listen(port);
    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') startServer(port + 1);
    });
};
startServer(process.env.PORT || 3000);

// Bot la ap toujou kòmanse nan Mode PUBLIC kounye a
let isPublic = true; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        printQRInTerminal: false
    })

    // --- PAIRING CODE LOGIC ---
    if (!sock.authState.creds.registered) {
        const ownerPhone = settings.ownerNumber.replace(/[^0-9]/g, '')
        console.log(`\n🔄 Demand kòd pou: ${ownerPhone}...`)
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(ownerPhone)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n✅ KÒD PAIRING OU: ${code}\n`)
            } catch (err) { console.log("❌ Erè nan demand kòd la.") }
        }, 6000)
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === "open") {
            const prefix = settings.prefix || "."
            const ownerJid = settings.ownerNumber.replace(/[^0-9]/g, '') + "@s.whatsapp.net"
            
            console.log(`\n🎊 QUEEN COLAMBIA CONNECTED!\n📢 Mode: ${isPublic ? 'Public' : 'Private'}`)
            
            // Notifikasyon ki montre Prefiks ak Mode
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
                } catch (e) { console.log(`❌ Error loading ${file}:`, e.message) }
            }
        })
    }

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== 'notify') return
        const m = messages[0]
        if (!m.message) return
        const from = m.key.remoteJid
        const sender = m.key.participant || m.key.remoteJid
        
        const isOwner = settings.ownerNumber.replace(/[^0-9]/g, '') === sender.split('@')[0].replace(/[^0-9]/g, '')
        const text = m.message.conversation || m.message.extendedTextMessage?.text || ""
        const prefix = settings.prefix || "."

        if (!text.startsWith(prefix)) return
        if (!isPublic && !isOwner) return;

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        // Kòmand pou chanje mode
        if (commandName === "public" && isOwner) {
            isPublic = true
            return sock.sendMessage(from, { text: "✅ Mode kounye a: *PUBLIC*" })
        }
        if (commandName === "private" && isOwner) {
            isPublic = false
            return sock.sendMessage(from, { text: "🔒 Mode kounye a: *PRIVATE*" })
        }

        if (commands[commandName]) {
            await commands[commandName](sock, m, args)
        }
    })
}

startBot().catch(err => console.log(err))
