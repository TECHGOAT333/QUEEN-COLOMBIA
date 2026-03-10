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
const path = require("path") // Sa a ap ranje ReferenceError la
const settings = require("./settings")

// --- SERVER POU UPTIME ---
const startServer = (port) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('QUEEN COLAMBIA ONLINE');
    });
    server.listen(port).on('error', (e) => {
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
        // Konfigirasyon sa a ede notifikasyon an monte anlè a
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        printQRInTerminal: false
    })

    // --- PAIRING LOGIC ---
    if (!sock.authState.creds.registered) {
        const ownerPhone = settings.ownerNumber.replace(/[^0-9]/g, '')
        console.log(`\n🔄 Demand kòd pou: ${ownerPhone}...`)
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(ownerPhone)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n✅ KÒD PAIRING OU SE: ${code}\n`)
                console.log(`👉 Tcheke notifikasyon anlè telefòn ou kounye a!`)
            } catch (err) { 
                console.log("❌ Erè nan demand kòd la. Rekòmanse bot la.") 
            }
        }, 3000)
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === "open") {
            const ownerJid = settings.ownerNumber.replace(/[^0-9]/g, '') + "@s.whatsapp.net"
            console.log(`\n🎊 QUEEN COLAMBIA CONNECTED!`)
            await sock.sendMessage(ownerJid, { text: `✅ *QUEEN COLAMBIA IS ONLINE*\n\nMode: ${isPublic ? 'Public' : 'Private'}` })
        }
    })

    // 📂 Auto-load commands
    const commands = {}
    const commandsPath = path.join(__dirname, "commands")
    if (fs.existsSync(commandsPath)) {
        fs.readdirSync(commandsPath).forEach(file => {
            if (file.endsWith(".js")) {
                const cmd = require(path.join(commandsPath, file))
                commands[file.replace(".js", "")] = cmd
            }
        })
    }

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== 'notify') return
        const m = messages[0]
        if (!m.message) return
        
        const from = m.key.remoteJid
        const sender = m.key.participant || m.key.remoteJid
        const isOwner = sender.includes(settings.ownerNumber.replace(/[^0-9]/g, '')) || m.key.fromMe
        
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || "").trim()
        const prefix = settings.prefix || "."

        if (!text.startsWith(prefix)) return
        if (!isPublic && !isOwner) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        if (commandName === "ping") return sock.sendMessage(from, { text: "Pong! 🏓" }, { quoted: m })

        if (commands[commandName]) {
            try { await commands[commandName](sock, m, args) } catch (e) { console.log(e) }
        }
    })
}

startBot().catch(err => console.log(err))
