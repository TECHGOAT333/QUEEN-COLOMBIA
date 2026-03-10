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

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        // Chanje non browser la pou WhatsApp rekonèt li pi byen
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        printQRInTerminal: false
    })

    // --- PAIRING CODE LOGIC (Fòse Notifikasyon) ---
    if (!sock.authState.creds.registered) {
        const ownerPhone = settings.ownerNumber.replace(/[^0-9]/g, '')
        
        console.log(`\n🔄 Demand kòd pou: ${ownerPhone}...`)
        
        // Nou met yon ti delè 6 segonn pou sèvè a fin estabilize anvan nou mande kòd la
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(ownerPhone)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n✅ KÒD PAIRING OU: ${code}`)
                console.log(`💡 Si notifikasyon an pa moute anlè, antre kòd sa a manyèlman.\n`)
            } catch (err) {
                console.log("❌ Erè nan demand kòd la. WhatsApp ka bloke demand yo pou yon ti tan.")
            }
        }, 6000)
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === "open") {
            console.log(`\n🎊 QUEEN COLAMBIA CONNECTED!`)
            // Notifikasyon konfimasyon apre koneksyon
            await sock.sendMessage(settings.ownerNumber.replace(/[^0-9]/g, '') + "@s.whatsapp.net", { 
                text: "✅ *QUEEN COLAMBIA IS ONLINE*\n\nBot la konekte nèt kounye a!" 
            })
        }
    })
}

startBot().catch(err => console.log(err))
