const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require("fs")
const http = require("http")
const path = require("path") 
const settings = require("./settings")

// --- SMART UPTIME SERVER ---
const startServer = (port) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('QUEEN COLAMBIA IS ONLINE');
    });
    server.listen(port);
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
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        printQRInTerminal: false
    })

    if (!sock.authState.creds.registered) {
        const ownerPhone = settings.ownerNumber.replace(/[^0-9]/g, '')
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(ownerPhone)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n✅ KÒD PAIRING: ${code}\n`)
            } catch (err) { console.log(err) }
        }, 5000)
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
        } else if (connection === "open") {
            const ownerJid = settings.ownerNumber.replace(/[^0-9]/g, '') + "@s.whatsapp.net"
            console.log(`\n🎊 QUEEN COLAMBIA CONNECTED!`)
            await sock.sendMessage(ownerJid, { text: `✅ *QUEEN COLAMBIA IS ONLINE*\n\n⚙️ *Prefix:* [ ${settings.prefix || "."} ]\n📢 *Mode:* ${isPublic ? 'Public' : 'Private'}` })
        }
    })

    // 📂 Chaje kòmand yo
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
        const ownerNum = settings.ownerNumber.replace(/[^0-9]/g, '')
        const isOwner = sender.includes(ownerNum) || m.key.fromMe // Sa a pèmèt li reponn ou menm si se ou k ekri l
        
        const text = m.message.conversation || m.message.extendedTextMessage?.text || ""
        const prefix = settings.prefix || "."

        if (!text.startsWith(prefix)) return
        if (!isPublic && !isOwner) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        // Kòmand Mode
        if (commandName === "public" && isOwner) {
            isPublic = true
            return sock.sendMessage(from, { text: "✅ Mode: *PUBLIC*" })
        }
        if (commandName === "private" && isOwner) {
            isPublic = false
            return sock.sendMessage(from, { text: "🔒 Mode: *PRIVATE*" })
        }

        // EGZEKITE KÒMAND LAN
        if (commands[commandName]) {
            try {
                await commands[commandName](sock, m, args)
            } catch (err) {
                console.log(err)
            }
        } else if (isOwner && commandName === "ping") {
            // Test rapid si kòmand file yo pa mache
            await sock.sendMessage(from, { text: "Pong! 🏓 Bot la ap reponn kounye a." })
        }
    })
}

startBot().catch(err => console.log(err))
