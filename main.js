const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason,
    jidDecode
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require("fs")
const path = require("path")
const settings = require("./settings")

// --- KONFIGIRASYON MOD (Public/Private) ---
let isPublic = true; // Chanje sa pou 'false' si ou vle bot la reponn ou menm sèlman

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ["Mac OS", "Chrome", "10.15.7"],
        printQRInTerminal: false,
        getMessage: async (key) => { return { conversation: 'QUEEN COLAMBIA' } }
    })

    // 📂 Chaje kòmand yo otomatikman
    const commands = {}
    const commandsPath = path.join(__dirname, "commands")
    if (fs.existsSync(commandsPath)) {
        fs.readdirSync(commandsPath).forEach(file => {
            if (file.endsWith(".js")) {
                const cmd = require(path.join(commandsPath, file))
                commands[file.replace(".js", "")] = cmd
            }
        })
        console.log(`✅ ${Object.keys(commands).length} kòmand chaje!`)
    }

    // --- PAIRING CODE ---
    const phoneNumber = settings.ownerNumber.replace(/[^0-9]/g, '') 
    if (!sock.authState.creds.registered) {
        console.log(`\n🔄 Ap prepare kòd pou: ${phoneNumber}...`)
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n✅ KÒD KONEKSYON: ${code}\n`)
            } catch (err) { console.log("❌ Erè pairing.") }
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
                    caption: `👋 Byenveni @${num.split("@")[0]} nan gwoup ${metadata.subject}!\n\nSèvi ak .menu pou w wè sa m ka fè.`,
                    mentions: [num]
                })
            } else if (anu.action == 'remove') {
                sock.sendMessage(anu.id, { 
                    text: `🚫 @${num.split("@")[0]} sot kite gwoup la. Babay!`,
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
            console.log(`\n🎊 QUEEN COLAMBIA KONEKTE! Mode: ${isPublic ? 'Public' : 'Private'}`)
        }
    })

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== 'notify') return
        const m = messages[0]
        if (!m.message) return
        const from = m.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const sender = m.key.participant || m.key.remoteJid
        const isOwner = settings.ownerNumber.includes(sender.split('@')[0])

        // --- MODE PUBLIC/PRIVATE ---
        if (!isPublic && !isOwner) return;

        const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ""
        
        // --- AUTO STATUS VIEW & LIKE ---
        if (from === 'status@broadcast') {
            await sock.readMessages([m.key])
            await sock.sendMessage('status@broadcast', { react: { text: '👑', key: m.key } }, { statusJidList: [m.key.participant] })
            return
        }

        const prefix = settings.prefix || "."
        if (!text.startsWith(prefix)) return

        // --- AUTO TYPING ---
        await sock.sendPresenceUpdate('composing', from)

        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        // --- KÒD POU MODE (PUBLIC/PRIVATE) ---
        if (commandName === "public") {
            if (!isOwner) return
            isPublic = true
            return sock.sendMessage(from, { text: "✅ Bot la kounye a an mode PUBLIC." })
        }
        if (commandName === "private") {
            if (!isOwner) return
            isPublic = false
            return sock.sendMessage(from, { text: "🔒 Bot la kounye a an mode PRIVATE." })
        }

        // --- EKZEKITE KÒMAND YO ---
        if (commands[commandName]) {
            try {
                // Auto React sou kòmand
                await sock.sendMessage(from, { react: { text: "⚡", key: m.key } })
                await commands[commandName](sock, m, args)
            } catch (err) { console.error(err) }
        }
    })
}

startBot().catch(err => console.log("Erè:", err))
