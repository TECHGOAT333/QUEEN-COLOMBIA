const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    DisconnectReason,
    downloadContentFromMessage
} = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require("fs")
const http = require("http")
const path = require("path") 
const settings = require("./settings")

// --- SERVER POU UPTIME ---
const startServer = (port) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('QUEEN COLAMBIA ONLINE');
    });
    server.listen(port).on('error', (e) => {
        if (e.code === 'EADDRINUSE') startServer(port + 1);
    });
};
startServer(process.env.PORT || 3000);

let isPublic = true; 
let antilink = true; // Default: Li Limen

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        printQRInTerminal: false
    })

    if (!sock.authState.creds.registered) {
        const ownerPhone = settings.ownerNumber.replace(/[^0-9]/g, '')
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(ownerPhone)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n✅ KÒD PAIRING: ${code}\n`)
            } catch (err) { console.log(err) }
        }, 3000)
    }

    sock.ev.on("creds.update", saveCreds)

    // --- AUTO STATUS REACT ---
    sock.ev.on("messages.upsert", async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m.message) return;
        if (m.key.remoteJid === "status@broadcast") {
            await sock.readMessages([m.key]);
            await sock.sendMessage("status@broadcast", { react: { text: "💚", key: m.key } }, { statusJidList: [m.key.participant] });
        }
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
        } else if (connection === "open") {
            const ownerJid = settings.ownerNumber.replace(/[^0-9]/g, '') + "@s.whatsapp.net"
            console.log(`\n🎊 QUEEN COLAMBIA CONNECTED!`)
            await sock.sendMessage(ownerJid, { text: `✅ *QUEEN COLAMBIA IS ONLINE*\n\n🛡️ Antilink status: ${antilink ? 'ON' : 'OFF'}` })
        }
    })

    // 📂 Auto-load commands
    const commands = {}
    const commandsPath = path.join(__dirname, "commands")
    if (fs.existsSync(commandsPath)) {
        fs.readdirSync(commandsPath).forEach(file => {
            if (file.endsWith(".js")) {
                const cmd = require(path.join(commandsPath, file))
                commands[file.replace(".js", "")] = cmd
            }
        })
    }

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== 'notify') return
        const m = messages[0]
        if (!m.message || m.key.remoteJid === "status@broadcast") return
        
        const from = m.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const sender = m.key.participant || m.key.remoteJid
        const isOwner = sender.includes(settings.ownerNumber.replace(/[^0-9]/g, '')) || m.key.fromMe
        
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || "").trim()
        const prefix = settings.prefix || "."

        // --- 🛡️ ANTILINK EXECUTION ---
        if (isGroup && antilink && text.includes("chat.whatsapp.com") && !isOwner) {
            const groupMetadata = await sock.groupMetadata(from)
            const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id)
            const isBotAdmin = admins.includes(sock.user.id.split(':')[0] + '@s.whatsapp.net')
            if (isBotAdmin && !admins.includes(sender)) {
                await sock.sendMessage(from, { delete: m.key })
                await sock.groupParticipantsUpdate(from, [sender], "remove")
                await sock.sendMessage(from, { text: "🚫 *Antilink*: Lyen gwoup entèdi. Mwen retire moun nan." })
            }
        }

        if (!text.startsWith(prefix)) return
        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        // --- ⚙️ ANTILINK ON/OFF COMMAND ---
        if (commandName === "antilink" && isOwner) {
            if (!args[0]) return sock.sendMessage(from, { text: `Itilizasyon: ${prefix}antilink on / off` })
            if (args[0] === "on") {
                antilink = true
                return sock.sendMessage(from, { text: "🛡️ *Antilink limen!* Bot la ap retire nenpòt moun ki voye lyen gwoup." })
            } else if (args[0] === "off") {
                antilink = false
                return sock.sendMessage(from, { text: "🔓 *Antilink koupe!* Moun ka voye lyen kounye a." })
            }
        }

        // --- 👁️ VV COMMAND ---
        if (commandName === "vv") {
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
            if (!quoted || (!quoted.viewOnceMessageV2 && !quoted.viewOnceMessage)) return sock.sendMessage(from, { text: "Reply yon mesaj View Once!" })
            const viewOnce = quoted.viewOnceMessageV2 || quoted.viewOnceMessage
            const msgType = Object.keys(viewOnce.message)[0]
            const stream = await downloadContentFromMessage(viewOnce.message[msgType], msgType.replace('Message', ''))
            let buffer = Buffer.from([])
            for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]) }
            if (msgType === 'imageMessage') await sock.sendMessage(from, { image: buffer, caption: "✅ Debloke" }, { quoted: m })
            if (msgType === 'videoMessage') await sock.sendMessage(from, { video: buffer, caption: "✅ Debloke" }, { quoted: m })
            return
        }

        if (commands[commandName]) {
            try { 
                await sock.sendPresenceUpdate('composing', from)
                await commands[commandName](sock, m, args) 
                await sock.sendPresenceUpdate('paused', from)
            } catch (e) { console.log(e) }
        }
    })
}

startBot().catch(err => console.log(err))
