const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys")
const fs = require("fs")
const path = require("path")
const pino = require("pino")
const settings = require("./settings")

// 📂 Chaje kòmand yo
const commands = {}
const commandsPath = path.resolve(__dirname, "commands")

if (fs.existsSync(commandsPath)) {
    fs.readdirSync(commandsPath).forEach(file => {
        if (file.endsWith(".js")) {
            const cmd = require(path.join(commandsPath, file))
            commands[file.replace(".js", "")] = cmd
        }
    })
}

async function startBot(){
    const { state, saveCreds } = await useMultiFileAuthState("session")

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        // Chanjman isit la pou deklanche notifikasyon an
        browser: ["Chrome (Linux)", "Chrome", "1.1.0"] 
    })

    // --- PAIRING CODE (CHIF YO) ---
    const phoneNumber = "50934410653" 

    if (!sock.authState.creds.registered) {
        console.log("Ap prepare kòd koneksyon an...")
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n\n==============================`)
                console.log(`✅ KÒD KONEKSYON OU SE: ${code}`)
                console.log(`==============================\n\n`)
            } catch (err) {
                console.log("Erè nan prepare kòd la: ", err)
            }
        }, 3000)
    }
    // ------------------------------

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection } = update
        if(connection === "close") {
            console.log("Koneksyon koupe, l ap rekòmanse...")
            startBot()
        }
        if(connection === "open") console.log("Bot konekte ak siksè ✅")
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0]
        if(!m.message) return

        const text = m.message.conversation || m.message.extendedTextMessage?.text || ""
        const from = m.key.remoteJid
        const sender = m.key.participant || from

        // 🔒 Anti-Link
        if(/chat.whatsapp.com/i.test(text) && !m.key.fromMe){
            try {
                await sock.sendMessage(from, { delete: m.key })
                await sock.groupParticipantsUpdate(from, [sender], "remove")
            } catch(e) { console.log("Erè Anti-Link:", e) }
            return
        }

        const prefix = settings.prefix || "."
        if(!text.startsWith(prefix)) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        if(commands[commandName]){
            try {
                await commands[commandName](sock, m, args)
            } catch(err) {
                console.log("Erè kòmand:", err)
            }
        }
    })
}

startBot()
