const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason,
    downloadContentFromMessage
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require("fs")
const path = require("path")
const http = require("http") // Sa a pa bezwen npm install
const settings = require("./settings")

// --- SIMPLE UPTIME SERVER (No Express Needed) ---
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>QUEEN COLAMBIA IS ONLINE</h1>');
}).listen(process.env.PORT || 3000);

let isPublic = true; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ["QUEEN COLAMBIA", "Chrome", "1.0.0"],
        printQRInTerminal: false,
        getMessage: async (key) => { return { conversation: 'QUEEN COLAMBIA' } }
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
        console.log(`✅ ${Object.keys(commands).length} Commands Loaded!`)
    }

    // --- PAIRING CODE ---
    const ownerPhone = settings.ownerNumber.replace(/[^0-9]/g, '') 
    if (!sock.authState.creds.registered) {
        console.log(`\n🔄 Generating pairing code for Owner: ${ownerPhone}...`)
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(ownerPhone)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n✅ OWNER CONNECTION CODE: ${code}\n`)
            } catch (err) { console.log("❌ Pairing error.") }
        }, 5000) 
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
        } else if (connection === "open") {
            console.log(`\n🎊 QUEEN COLAMBIA CONNECTED! Mode: ${isPublic ? 'Public' : 'Private'}`)
        }
    })

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== 'notify') return
        const m = messages[0]
        if (!m.message) return
        const from = m.key.remoteJid
        const sender = m.key.participant || m.key.remoteJid
        
        const cleanOwner = settings.ownerNumber.replace(/[^0-9]/g, '')
        const cleanSender = sender.split('@')[0].replace(/[^0-9]/g, '')
        const isOwner = cleanOwner === cleanSender

        if (!isPublic && !isOwner) return;

        const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ""
        
        if (from === 'status@broadcast') {
            await sock.readMessages([m.key])
            await sock.sendMessage('status@broadcast', { react: { text: '👑', key: m.key } }, { statusJidList: [m.key.participant] })
            return
        }

        const prefix = settings.prefix || "."
        if (!text.startsWith(prefix)) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        // --- PUBLIC/PRIVATE NOTIFICATIONS (ENGLISH) ---
        if (commandName === "public" || (commandName === "mode" && args[0] === "public")) {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Access Denied: Owner Only." })
            isPublic = true
            return sock.sendMessage(from, { text: "✅ *QUEEN COLAMBIA*\n\nBot is now in *PUBLIC* mode." })
        }
        
        if (commandName === "private" || (commandName === "mode" && args[0] === "private")) {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Access Denied: Owner Only." })
            isPublic = false
            return sock.sendMessage(from, { text: "🔒 *QUEEN COLAMBIA*\n\nBot is now in *PRIVATE* mode." })
        }

        // --- ALIAS SYSTEM ---
        let cmdToRun = commandName;
        if (commandName === "facebook") cmdToRun = "fb";
        if (commandName === "instagram" || commandName === "ig") cmdToRun = "igdl";
        if (commandName === "ytmp3" || commandName === "song") cmdToRun = "play";
        if (commandName === "ytmp4" || commandName === "vdl") cmdToRun = "video";
        if (commandName === "viewonce") cmdToRun = "vv";

        if (commands[cmdToRun]) {
            try {
                await sock.sendPresenceUpdate('composing', from)
                await sock.sendMessage(from, { react: { text: "⚡", key: m.key } })
                await commands[cmdToRun](sock, m, args)
            } catch (err) { console.error("Command Error:", err) }
        }
    })
}

startBot().catch(err => console.log("Critical Error:", err))
