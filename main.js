const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason 
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require("fs")
const path = require("path")
const settings = require("./settings")

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ["Mac OS", "Chrome", "10.15.7"],
        printQRInTerminal: false
    })

    // 📂 Chaje kòmand yo
    const commands = {}
    const commandsPath = path.join(__dirname, "commands")

    if (fs.existsSync(commandsPath)) {
        fs.readdirSync(commandsPath).forEach(file => {
            if (file.endsWith(".js")) {
                try {
                    const cmd = require(path.join(commandsPath, file))
                    commands[file.replace(".js", "")] = cmd
                    console.log(`✅ Kòmand chaje: ${file}`)
                } catch (e) {
                    console.log(`❌ Erè nan ${file}:`, e.message)
                }
            }
        })
    }

    // --- PAIRING CODE ---
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
                console.log("❌ Erè nan pairing code la.")
            }
        }, 5000) 
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log("Koneksyon koupe. Rekòmanse:", shouldReconnect)
            if (shouldReconnect) startBot()
        } else if (connection === "open") {
            console.log(`\n🎊 ${settings.botName} KONEKTE AVÈK SIKSÈ! ✅`)
        }
    })

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== 'notify') return
        const m = messages[0]
        if (!m.message) return

        const from = m.key.remoteJid
        const text = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || ""
        
        console.log(`📩 Mesaj: [${from}] -> ${text}`)

        const prefix = settings.prefix || "."
        if (!text.startsWith(prefix)) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        if (commands[commandName]) {
            try {
                await commands[commandName](sock, m, args)
            } catch (err) {
                console.error("❌ Erè kòmand:", err)
            }
        }
    })
}

startBot().catch(err => console.log("Erè:", err))
