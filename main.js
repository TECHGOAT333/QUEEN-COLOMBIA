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
const path = require("path") 
const settings = require("./settings")

// --- SMART UPTIME SERVER (POU EVITE EADDRINUSE) ---
const startServer = (port) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('QUEEN COLAMBIA IS ONLINE');
    });
    server.listen(port).on('error', () => { /* Silansye si pò a okipe */ });
};
startServer(process.env.PORT || 3000);

let isPublic = true; 

async function startBot() {
    // Sèvi ak sesyon ki egziste deja nan folder "session" la
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: Browsers.macOS("Desktop"),
        printQRInTerminal: true // Si sesyon an mouri, l ap bay QR code olye pairing
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === "open") {
            const ownerJid = settings.ownerNumber.replace(/[^0-9]/g, '') + "@s.whatsapp.net"
            console.log(`\n🎊 QUEEN COLAMBIA CONNECTED!`)
            
            // Voye notifikasyon ONLINE bay Owner la sèlman
            await sock.sendMessage(ownerJid, { 
                text: `✅ *QUEEN COLAMBIA IS ONLINE*\n\n⚙️ *Prefix:* [ ${settings.prefix || "."} ]\n📢 *Mode:* ${isPublic ? 'Public' : 'Private'}` 
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
                } catch (e) { console.log(`❌ Error: ${file}`, e.message) }
            }
        })
    }

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== 'notify') return
        const m = messages[0]
        if (!m.message) return
        
        const from = m.key.remoteJid
        const sender = m.key.participant || m.key.remoteJid
        const ownerNum = settings.ownerNumber.replace(/[^0-9]/g, '')
        
        // Verifikasyon si se Owner la (ki gen ladan l si se bot la k ap pale ak tèt li)
        const isOwner = sender.includes(ownerNum) || m.key.fromMe
        
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || "").trim()
        const prefix = settings.prefix || "."

        if (!text.startsWith(prefix)) return
        if (!isPublic && !isOwner) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        // Kòmand entèn pou chanje Mode
        if (commandName === "public" && isOwner) {
            isPublic = true
            return sock.sendMessage(from, { text: "✅ Mode: *PUBLIC*" })
        }
        if (commandName === "private" && isOwner) {
            isPublic = false
            return sock.sendMessage(from, { text: "🔒 Mode: *PRIVATE*" })
        }

        // Test rapid pou verifye si bot la "active"
        if (commandName === "ping") {
            return sock.sendMessage(from, { text: "Pong! 🏓" }, { quoted: m })
        }

        // Egzekite kòmand ki nan folder commands la
        if (commands[commandName]) {
            try {
                await commands[commandName](sock, m, args)
            } catch (err) {
                console.log(`❌ Erè nan ${commandName}:`, err)
            }
        }
    })
}

startBot().catch(err => console.log("Erè fatal:", err))
