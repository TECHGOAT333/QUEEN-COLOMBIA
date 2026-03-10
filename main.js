const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    disconnectReason 
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require("fs")
const path = require("path")
const settings = require("./settings")

async function startBot() {
    // 1. Prepare sesyon an
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        // Chanje pou Mac OS pou fòse WhatsApp aksepte kòd la
        browser: ["Mac OS", "Chrome", "10.15.7"],
        printQRInTerminal: false
    })

    // 📂 Chaje kòmand yo nan folder "commands" la
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
                    console.log(`❌ Erè nan chaje ${file}:`, e.message)
                }
            }
        })
    }

    // --- SISTÈM PAIRING CODE ---
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
                console.log("❌ Erè: WhatsApp bloke tantativ la. Tann 1 èdtan.")
            }
        }, 5000) 
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401
            console.log("Koneksyon koupe. Ap rekòmanse...", shouldReconnect)
            if (shouldReconnect) startBot()
        } else if (connection === "open") {
            console.log(`\n🎊 ${settings
