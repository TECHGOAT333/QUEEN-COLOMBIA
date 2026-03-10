const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const pino = require("pino")
const settings = require("./settings")

async function startBot() {
    // 1. Prepare sesyon an
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        // Konfigirasyon ki pi stab pou Pairing nan 2026
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    })

    // --- SISTÈM PAIRING CODE ---
    // Li pran nimewo a dirèkteman nan settings.js ou a
    const phoneNumber = settings.ownerNumber.replace(/[^0-9]/g, '') 

    if (!sock.authState.creds.registered) {
        console.log(`\n🤖 BOT: ${settings.botName}`)
        console.log(`🔄 Ap prepare kòd pou: ${phoneNumber}...`)
        
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n====================================`)
                console.log(`✅ KÒD KONEKSYON OU SE: ${code}`)
                console.log(`====================================\n`)
            } catch (err) {
                console.log("❌ Erè: Nimewo a pa kòrèk oswa limit depase.")
            }
        }, 5000) 
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection } = update
        if (connection === "close") {
            startBot()
        } else if (connection === "open") {
            console.log(`\n🎊 ${settings.botName} KONEKTE AVÈK SIKSÈ! ✅`)
        }
    })
}

startBot()

