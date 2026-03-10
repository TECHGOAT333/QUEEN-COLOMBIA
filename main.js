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

// --- UPTIME SERVER ---
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

    // --- PAIRING CODE LOGIC ---
    if (!sock.authState.creds.registered) {
        const ownerPhone = settings.ownerNumber.replace(/[^0-9]/g, '')
        console.log(`\n🔄 Requesting pairing code for: ${ownerPhone}...`)
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(ownerPhone)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(`\n✅ YOUR PAIRING CODE: ${code}\n`)
            } catch (err) { console.log("Pairing Error:", err.message) }
        }, 3000)
    }

    sock.ev.on("creds.update", saveCreds)

    // --- AUTO STATUS REACT (RANDOM EMOJIS) ---
    sock.ev.on("messages.upsert", async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.remoteJid !== "status@broadcast") return;
        
        const emojis = ["💚", "🔥", "✨", "🙌", "💯", "👑", "🚀", "😍", "⚡", "💎"];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        try {
            await sock.readMessages([m.key]); 
            await sock.sendMessage("status@broadcast", { 
                react: { text: randomEmoji, key: m.key } 
            }, { statusJidList: [m.key.participant] });
            console.log(`✅ Reacted to ${m.pushName || 'Status'} with ${randomEmoji}`);
        } catch (e) { console.error("Status error:", e) }
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
                        text: `👋 Welcome @${name} to *${metadata.subject}*!\n\n🔔 Join our official channel for updates:\n${channelLink}`,
                        contextInfo: { 
                            mentionedJid: [num], 
                            externalAdReply: { 
                                title: "QUEEN COLAMBIA COMMUNITY", 
                                body: "Stay Updated!", 
                                thumbnailUrl: "https://files.catbox.moe/zdk50s.jpg", 
                                sourceUrl: channelLink, 
                                mediaType: 1, 
                                renderLargerThumbnail: true 
                            }
                        }
                    });
                } else if (action === 'remove') {
                    await sock.sendMessage(id, { text: `👋 Goodbye @${name}, we hope to see you again soon!`, contextInfo: { mentionedJid: [num] }});
                }
            }
        } catch (e) { console.log(e) }
    });

    // --- CONNECTION UPDATE ---
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
        } else if (connection === "open") {
            const ownerJid = settings.ownerNumber.replace(/[^0-9]/g, '') + "@s.whatsapp.net"
            console.log(`\n🎊 QUEEN COLAMBIA IS CONNECTED!`)

            const welcomeMsg = `✨ *QUEEN COLAMBIA IS ONLINE* ✨\n\n` +
                               `👑 *Status:* Connected Successfully\n` +
                               `🛡️ *AntiLink:* ${antilink ? '✅ Active' : '❌ Inactive'}\n` +
                               `🔄 *Auto-React:* ✅ Enabled\n\n` +
                               `🚀 *System is ready to serve!*`;

            await sock.sendMessage(ownerJid, { 
                text: welcomeMsg,
                contextInfo: {
                    externalAdReply: {
                        title: "SYSTEM ONLINE",
                        body: "Queen Colambia V2",
                        thumbnailUrl: "https://files.catbox.moe/zdk50s.jpg",
                        sourceUrl: channelLink,
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            })
        }
    })

    // --- COMMAND LOADER ---
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

        // --- ANTILINK LOGIC ---
        if (isGroup && antilink && text.includes("chat.whatsapp.com") && !isOwner) {
            const groupMetadata = await sock.groupMetadata(from)
            const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id)
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net'
            
            if (admins.includes(botId) && !admins.includes(sender)) {
                await sock.sendMessage(from, { delete: m.key })
                await sock.groupParticipantsUpdate(from, [sender], "remove")
                await sock.sendMessage(from, { text: `🚫 *AntiLink System:* Links are not allowed. User has been removed.` })
            }
        }

        if (!text.startsWith(prefix)) return
        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        // --- COMMAND HANDLER ---
        if (commands[commandName] || commandName === "vv" || commandName === "antilink") {
            try {
                // Visual feedback: Start reaction
                await sock.sendMessage(from, { react: { text: "⚡", key: m.key } });
                await sock.sendPresenceUpdate('composing', from);

                if (commandName === "antilink" && isOwner) {
                    antilink = args[0] === "on";
                    await sock.sendMessage(from, { text: `🛡️ *AntiLink:* ${antilink ? 'ENABLED ✅' : 'DISABLED ❌'}` });
                }

                else if (commandName === "vv") {
                    const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
                    const viewOnce = m.message.viewOnceMessageV2 || m.message.viewOnceMessage || quoted?.viewOnceMessageV2 || quoted?.viewOnceMessage
                    if (!viewOnce) throw new Error("Not a view once message");
                    
                    const msgType = Object.keys(viewOnce.message)[0]
                    const stream = await downloadContentFromMessage(viewOnce.message[msgType], msgType.replace('Message', ''))
                    let buffer = Buffer.from([])
                    for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]) }
                    
                    const cap = `👁️ *VIEW ONCE RECOVERED* - QUEEN COLAMBIA`
                    if (msgType === 'imageMessage') await sock.sendMessage(from, { image: buffer, caption: cap }, { quoted: m })
                    if (msgType === 'videoMessage') await sock.sendMessage(from, { video: buffer, caption: cap }, { quoted: m })
                }

                else if (commands[commandName]) {
                    await commands[commandName](sock, m, args);
                }

                // Final Reaction: Success
                await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
            } catch (e) {
                console.log(e);
                await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
            } finally {
                await sock.sendPresenceUpdate('paused', from);
            }
        }
    })
}

startBot().catch(err => console.log(err))
