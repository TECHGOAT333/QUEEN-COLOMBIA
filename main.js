const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const fs = require("fs")
const path = require("path")
const pino = require("pino")
const settings = require("./settings")

// 📂 Load commands (KORIJE)
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
        printQRInTerminal: true // Sa ap ede w wè QR la nan konsòl la
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update
        if(qr) console.log("掃碼 QR Code: scan li pou konekte bot la")
        if(connection === "close") {
            console.log("Koneksyon koupe, l ap rekòmanse...")
            startBot()
        }
        if(connection === "open") console.log("Bot konekte ✅")
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
                await sock.sendMessage(from, { text: "🚫 AntiLink: User removed!" })
            } catch(e) { console.log("Erè Anti-Link:", e) }
            return
        }

        // 🔹 Commands
        const prefix = settings.prefix || "."
        if(!text.startsWith(prefix)) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        if(commands[commandName]){
            try {
                await commands[commandName](sock, m, args)
            } catch(err) {
                console.log("Erè kòmand:", err)
                await sock.sendMessage(from, { text: "❌ Erè nan kòmand lan" }, { quoted: m })
            }
        }
    })
}

startBot()
