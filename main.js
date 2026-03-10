const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
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
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    })

    // 📂 Chaje kòmand yo nan folder commands la
    const commands = {}
    const commandsPath = path.join(__dirname, "commands")

    if (fs.existsSync(commandsPath)) {
        fs.readdirSync(commandsPath).forEach(file => {
            if (file.endsWith(".js")) {
                const cmd = require(path.join(commandsPath, file))
                commands[file.replace(".js", "")] = cmd
                console.log(`✅ Kòmand chaje: ${file}`)
            }
        })
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection } = update
        if (connection === "close") startBot()
        if (connection === "open") console.log("🎊 QUEEN COLAMBIA BOT PRÈ POU TRAVAY! ✅")
    })

    // 📩 Pati k ap koute mesaj pou bot la ka reponn
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== 'notify') return
        const m = messages[0]
        if (!m.message) return

        // Li mesaj la menm si se ou ki voye l ba tèt ou
        const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ""
        const from = m.key.remoteJid
        
        console.log(`📩 Mesaj resevwa: ${text}`) // W ap wè sa nan bwat nwa a

        const prefix = settings.prefix || "."
        if (!text.startsWith(prefix)) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        if (commands[commandName]) {
            try {
                console.log(`🏃 Egzekite: ${commandName}`)
                await commands[commandName](sock, m, args)
            } catch (err) {
                console.error("❌ Erè nan kòmand:", err)
            }
        }
    })
}

startBot()
