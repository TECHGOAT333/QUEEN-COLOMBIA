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

// --- SERVEUR UPTIME ---
const startServer = (port) => {
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('QUEEN COLAMBIA IS ONLINE');
    });
    server.listen(port).on('error', (e) => {
        if (e.code === 'EADDRINUSE') startServer(port + 1);
    });
};
startServer(process.env.PORT || 3000);

let isPublic = true; 
let antilink = true; 
const channelLink = "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V";

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

    // --- PAIRING CODE (CHIFFRES) ---
    if (!sock.authState.creds.registered) {
        const ownerPhone = settings.ownerNumber.replace(/[^0-9]/g, '')
        console.log(`\n🔄 Demande de code pour : ${ownerPhone}...`)
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(ownerPhone)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n✅ VOTRE CODE DE CONNEXION : ${code}\n`)
            } catch (err) { console.log("Erreur Pairing:", err.message) }
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

    // --- WELCOME & GOODBYE ---
    sock.ev.on("group-participants.update", async (anu) => {
        const { id, participants, action } = anu;
        try {
            const metadata = await sock.groupMetadata(id);
            for (const num of participants) {
                let name = num.split('@')[0];
                if (action === 'add') {
                    await sock.sendMessage(id, { 
                        text: `👋 Bienvenue @${name} dans *${metadata.subject}* !\n\n🔔 Suis notre canal :\n${channelLink}`,
                        contextInfo: { mentionedJid: [num], externalAdReply: { title: "QUEEN COLAMBIA", body: "Rejoins le canal", thumbnailUrl: "https://files.catbox.moe/zdk50s.jpg", sourceUrl: channelLink, mediaType: 1, renderLargerThumbnail: true }}
                    });
                } else if (action === 'remove') {
                    await sock.sendMessage(id, { text: `👋 Au revoir @${name}...`, contextInfo: { mentionedJid: [num] }});
                }
            }
        } catch (e) { console.log(e) }
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
        } else if (connection === "open") {
            const ownerJid = settings.ownerNumber.replace(/[^0-9]/g, '') + "@s.whatsapp.net"
            console.log(`\n🎊 QUEEN COLAMBIA CONNECTÉE !`)
            await sock.sendMessage(ownerJid, { text: `✅ *QUEEN COLAMBIA ONLINE*\n\n🛡️ Antilink: ${antilink ? 'ON' : 'OFF'}` })
        }
    })

    // --- GESTION DES COMMANDES ---
    const commands = {}
    const commandsPath = path.join(__dirname, "commands")
    if (fs.existsSync(commandsPath)) {
        fs.readdirSync(commandsPath).forEach(file => {
            if (file.endsWith(".js")) {
                commands[file.replace(".js", "")] = require(path.join(commandsPath, file))
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

        // --- ANTILINK ---
        if (isGroup && antilink && text.includes("chat.whatsapp.com") && !isOwner) {
            const groupMetadata = await sock.groupMetadata(from)
            const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id)
            if (admins.includes(sock.user.id.split(':')[0] + '@s.whatsapp.net') && !admins.includes(sender)) {
                await sock.sendMessage(from, { delete: m.key })
                await sock.groupParticipantsUpdate(from, [sender], "remove")
            }
        }

        if (!text.startsWith(prefix)) return
        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        // --- AUTO-TYPING ---
        await sock.sendPresenceUpdate('composing', from);

        // Commande Antilink ON/OFF
        if (commandName === "antilink" && isOwner) {
            antilink = args[0] === "on"
            return sock.sendMessage(from, { text: `🛡️ Antilink: *${antilink ? 'ON' : 'OFF'}*` })
        }

        // Commande VV (View Once)
        if (commandName === "vv") {
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
            const viewOnce = m.message.viewOnceMessageV2 || m.message.viewOnceMessage || quoted?.viewOnceMessageV2 || quoted?.viewOnceMessage
            if (!viewOnce) return sock.sendMessage(from, { text: "Réponds à un message View Once !" })
            const msgType = Object.keys(viewOnce.message)[0]
            const stream = await downloadContentFromMessage(viewOnce.message[msgType], msgType.replace('Message', ''))
            let buffer = Buffer.from([])
            for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]) }
            const cap = `👁️ *VV BYPASS* - QUEEN COLAMBIA`
            if (msgType === 'imageMessage') await sock.sendMessage(from, { image: buffer, caption: cap }, { quoted: m })
            if (msgType === 'videoMessage') await sock.sendMessage(from, { video: buffer, caption: cap }, { quoted: m })
            return
        }

        if (commands[commandName]) {
            try { await commands[commandName](sock, m, args) } catch (e) { console.log(e) }
        }
        await sock.sendPresenceUpdate('paused', from);
    })
}

startBot().catch(err => console.log(err))
