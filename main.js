const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require("fs")
const path = require("path")
const http = require("http")
const settings = require("./settings")

// --- SMART UPTIME SERVER (Evite EADDRINUSE) ---
const startServer = (port) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('QUEEN COLAMBIA IS ONLINE');
    });

    server.listen(port, () => {
        console.log(`✅ Server is active on port: ${port}`);
    });

    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            startServer(port + 1); // Eseye yon lòt pò si 3000 okipe
        }
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
        browser: ["QUEEN COLAMBIA", "Chrome", "1.0.0"],
        printQRInTerminal: false
    })

    // --- PAIRING CODE ---
    const ownerPhone = settings.ownerNumber.replace(/[^0-9]/g, '') 
    if (!sock.authState.creds.registered) {
        console.log(`\n🔄 Generating code for: ${ownerPhone}...`)
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(ownerPhone)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n✅ CONNECTION CODE: ${code}\n`)
            } catch (err) { console.log("❌ Pairing error.") }
        }, 5000) 
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
        } else if (connection === "open") {
            console.log(`\n🎊 CONNECTED!`)
            // Notifikasyon WhatsApp otomatik lè l fin konekte
            await sock.sendMessage(ownerPhone + "@s.whatsapp.net", { 
                text: "✅ *QUEEN COLAMBIA CONNECTED*\n\nBot la anliy kounye a sou OptikLink!" 
            })
        }
    })

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== 'notify') return
        const m = messages[0]
        if (!m.message) return
        const from = m.key.remoteJid
        const text = m.message.conversation || m.message.extendedTextMessage?.text || ""
        const prefix = settings.prefix || "."
        
        if (!text.startsWith(prefix)) return
        const args = text.slice(prefix.length).trim().split(/ +/)
        const cmd = args.shift().toLowerCase()

        // Kòmand Mode
        if (cmd === "public") isPublic = true
        if (cmd === "private") isPublic = false
    })
}

startBot().catch(err => console.log(err))
