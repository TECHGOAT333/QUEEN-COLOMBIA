const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason,
    downloadContentFromMessage,
    jidDecode
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require("fs")
const path = require("path")
const settings = require("./settings")

// --- MODE CONFIGURATION ---
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

    // 📂 Auto-load commands
    const commands = {}
    const commandsPath = path.join(__dirname, "commands")
    if (fs.existsSync(commandsPath)) {
        fs.readdirSync(commandsPath).forEach(file => {
            if (file.endsWith(".js")) {
                try {
                    const cmd = require(path.join(commandsPath, file))
                    commands[file.replace(".js", "")] = cmd
                } catch (e) {
                    console.log(`❌ Error loading ${file}:`, e.message)
                }
            }
        })
        console.log(`✅ ${Object.keys(commands).length} Commands Loaded!`)
    }

    // --- PAIRING CODE ---
    const phoneNumber = settings.ownerNumber.replace(/[^0-9]/g, '') 
    if (!sock.authState.creds.registered) {
        console.log(`\n🔄 Generating pairing code for: ${phoneNumber}...`)
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n✅ CONNECTION CODE: ${code}\n`)
            } catch (err) { console.log("❌ Pairing error.") }
        }, 5000) 
    }

    sock.ev.on("creds.update", saveCreds)

    // --- WELCOME & GOODBYE ---
    sock.ev.on("group-participants.update", async (anu) => {
        const metadata = await sock.groupMetadata(anu.id)
        const participants = anu.participants
        for (let num of participants) {
            let ppuser;
            try { ppuser = await sock.profilePictureUrl(num, 'image') } catch { ppuser = 'https://files.catbox.moe/3dwe96.jpg' }

            if (anu.action == 'add') {
                sock.sendMessage(anu.id, { 
                    image: { url: ppuser }, 
                    caption: `👋 Welcome @${num.split("@")[0]} to ${metadata.subject}!\n\nType .menu to see what I can do.`,
                    mentions: [num]
                })
            } else if (anu.action == 'remove') {
                sock.sendMessage(anu.id, { 
                    text: `🚫 @${num.split("@")[0]} has left the group. Goodbye!`,
                    mentions: [num]
                })
            }
        }
    })

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
        } else if (connection === "open") {
            console.log(`\n🎊 QUEEN COLAMBIA CONNECTED! Mode: ${isPublic ? 'Public' : 'Private'}`)
        }
    })

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== 'notify') return
        const m = messages[0]
        if (!m.message) return
        const from = m.key.remoteJid
        const sender = m.key.participant || m.key.remoteJid
        
        // Clean owner number for comparison
        const cleanOwner = settings.ownerNumber.replace(/[^0-9]/g, '')
        const cleanSender = sender.split('@')[0].replace(/[^0-9]/g, '')
        const isOwner = cleanOwner === cleanSender

        if (!isPublic && !isOwner) return;

        const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ""
        
        // --- AUTO STATUS VIEW ---
        if (from === 'status@broadcast') {
            await sock.readMessages([m.key])
            await sock.sendMessage('status@broadcast', { react: { text: '👑', key: m.key } }, { statusJidList: [m.key.participant] })
            return
        }

        const prefix = settings.prefix || "."
        if (!text.startsWith(prefix)) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        // --- MODE LOGIC ---
        if (commandName === "public" || (commandName === "mode" && args[0] === "public")) {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Only my Owner can use this command." })
            isPublic = true
            return sock.sendMessage(from, { text: "✅ *QUEEN COLAMBIA*\n\nBot is now in *PUBLIC* mode." })
        }
        
        if (commandName === "private" || (commandName === "mode" && args[0] === "private")) {
            if (!isOwner) return sock.sendMessage(from, { text: "❌ Only my Owner can use this command." })
            isPublic = false
            return sock.sendMessage(from, { text: "🔒 *QUEEN COLAMBIA*\n\nBot is now in *PRIVATE* mode." })
        }

        // --- ALIAS SYSTEM ---
        let cmdToRun = commandName;
        if (commandName === "facebook") cmdToRun = "fb";
        if (commandName === "instagram" || commandName === "ig") cmdToRun = "igdl";
        if (commandName === "ytmp3" || commandName === "song") cmdToRun = "play";
        if (commandName === "ytmp4" || commandName === "vdl") cmdToRun = "video";
        if (commandName === "viewonce") cmdToRun = "vv"; // Ajoute Alias pou VV

        if (commands[cmdToRun]) {
            try {
                await sock.sendPresenceUpdate('composing', from)
                await sock.sendMessage(from, { react: { text: "⚡", key: m.key } })
                await commands[cmdToRun](sock, m, args)
            } catch (err) { 
                console.error("Command Error:", err)
            }
        }
    })
}

startBot().catch(err => console.log("Critical Error:", err))
