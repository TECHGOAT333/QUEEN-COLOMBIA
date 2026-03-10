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
const http = require("http")
const settings = require("./settings")

// --- SAFE UPTIME SERVER ---
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>QUEEN COLAMBIA IS ONLINE</h1>');
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.log('⚠️ Port okipe, bot la ap kontinye kouri san sèvè web la...');
    }
});

server.listen(process.env.PORT || 3000);

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

    // --- PAIRING CODE LOGIC ---
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

    // --- NOTIFIKASYON KONEKSYON ---
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
        } else if (connection === "open") {
            console.log(`\n🎊 QUEEN COLAMBIA CONNECTED! Mode: ${isPublic ? 'Public' : 'Private'}`)
            
            // Voye notifikasyon bay Owner la osito li konekte
            const msg = `✅ *QUEEN COLAMBIA IS ONLINE*\n\nYour bot has been successfully connected.\n\n👤 *Owner:* ${ownerPhone}\n📢 *Mode:* ${isPublic ? 'Public' : 'Private'}\n🛠 *Status:* Ready to use!`;
            await sock.sendMessage(ownerPhone + "@s.whatsapp.net", { text: msg });
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
        
        const cleanOwner = settings.ownerNumber.replace(/[^0-9]/g, '')
        const cleanSender = sender.split('@')[0].replace(/[^0-9]/g, '')
        const isOwner = cleanOwner === cleanSender

        if (!isPublic && !isOwner) return;

        const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ""
        const prefix = settings.prefix || "."
        if (!text.startsWith(prefix)) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        // --- COMMAND LOGIC (PUBLIC/PRIVATE) ---
        if (commandName === "public") {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Owner Only." })
            isPublic = true
            return sock.sendMessage(from, { text: "✅ Mode: *PUBLIC*" })
        }
        
        if (commandName === "private") {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Owner Only." })
            isPublic = false
            return sock.sendMessage(from, { text: "🔒 Mode: *PRIVATE*" })
        }

        // --- EXECUTE COMMANDS ---
        let cmdToRun = commandName;
        if (commandName === "instagram") cmdToRun = "igdl";
        if (commandName === "song") cmdToRun = "play";

        if (commands[cmdToRun]) {
            await sock.sendMessage(from, { react: { text: "⚡", key: m.key } })
            await commands[cmdToRun](sock, m, args)
        }
    })
}

startBot().catch(err => console.log("Critical Error:", err))
