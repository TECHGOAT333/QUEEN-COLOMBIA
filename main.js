const { default: makeWASocket, useMultiFileAuthState, proto } = require("@whiskeysockets/baileys")
const fs = require("fs")
const path = require("path")
const pino = require("pino")
const settings = require("./settings")

// 📂 Load commands
const commands = {}
fs.readdirSync("./commands").forEach(folderOrFile => {
    const folderPath = path.join("./commands", folderOrFile)
    if (fs.statSync(folderPath).isDirectory()) {
        fs.readdirSync(folderPath).forEach(file => {
            if(file.endsWith(".js")){
                const cmd = require(path.join(folderPath, file))
                commands[file.replace(".js","")] = cmd
            }
        })
    } else if(folderOrFile.endsWith(".js")){
        const cmd = require(path.join("./commands", folderOrFile))
        commands[folderOrFile.replace(".js","")] = cmd
    }
})

async function startBot(){

    const { state, saveCreds } = await useMultiFileAuthState("session")

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", update => {
        if(update.qr) console.log("QR Code: scan li pou konekte bot la")
        if(update.connection === "close") console.log("Connection close, restart bot")
        if(update.connection === "open") console.log("Bot konekte ✅")
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0]
        if(!m.message) return

        const text = m.message.conversation || m.message.extendedTextMessage?.text
        if(!text) return

        const from = m.key.remoteJid
        const sender = m.key.participant || from

        // 🔒 Anti-Link
        const isLink = /chat.whatsapp.com/i
        if(isLink.test(text)){
            try{
                if(!m.key.fromMe){ // pa efase pwòp mesaj bot la
                    await sock.sendMessage(from,{delete: m.key})
                    await sock.groupParticipantsUpdate(from,[sender],"remove")
                    await sock.sendMessage(from,{text:"🚫 AntiLink: User removed for sending group link!"})
                }
            }catch(err){ console.log(err) }
            return
        }

        // 🔹 Commands
        const prefix = settings.prefix || "."
        if(!text.startsWith(prefix)) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const command = args.shift().toLowerCase()

        if(commands[command]){
            try{
                await commands[command](sock, m, args)
            }catch(err){
                console.log(err)
                await sock.sendMessage(from,{text:"❌ Error executing command"},{quoted:m})
            }
        }

    })

}

startBot()
