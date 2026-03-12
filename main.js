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

    // --- AUTO STATUS REACT ---
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
        } catch (e) { console.error("Status error:", e) }
    });

    // --- CONNECTION UPDATE ---
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === "close") {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot()
        } else if (connection === "open") {
            const ownerJid = settings.ownerNumber.replace(/[^0-9]/g, '') + "@s.whatsapp.net"
            console.log(`\n🎊 QUEEN COLAMBIA IS CONNECTED!`)
            const welcomeMsg = `✨ *QUEEN COLAMBIA IS ONLINE* ✨\n\n👑 *Status:* Connected\n🛡️ *AntiLink:* ${antilink ? '✅ Active' : '❌ Inactive'}\n🚀 *System Ready!*`;
            await sock.sendMessage(ownerJid, { text: welcomeMsg })
        }
    })

    // --- COMMAND LOADER ---
    const commands = {}
    const commandsPath = path.join(__dirname, "commands")
    const loadCommands = () => {
        if (fs.existsSync(commandsPath)) {
            fs.readdirSync(commandsPath).forEach(file => {
                if (file.endsWith(".js")) {
                    try {
                        const cmdName = file.replace(".js", "");
                        commands[cmdName] = require(path.join(commandsPath, file));
                    } catch (e) { console.error(`Failed to load command ${file}`); }
                }
            })
        }
    }
    loadCommands();

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

        // --- FIXED ANTILINK SYSTEM ---
        if (isGroup && antilink && text.includes("chat.whatsapp.com")) {
            try {
                const groupMetadata = await sock.groupMetadata(from)
                const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id)
                const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net'
                const isBotAdmin = admins.includes(botId)
                const isSenderAdmin = admins.includes(sender)

                if (!isOwner && !isSenderAdmin && isBotAdmin) {
                    await sock.sendMessage(from, { delete: m.key })
                    await sock.groupParticipantsUpdate(from, [sender], "remove")
                    await sock.sendMessage(from, { text: `🚫 *AntiLink:* @${sender.split('@')[0]} removed for sharing links.`, contextInfo: { mentionedJid: [sender] }})
                }
            } catch (e) { console.error(e) }
        }

        if (!text.startsWith(prefix)) return
        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        // --- INTEGRATED COMMANDS ---
        try {
            if (commandName === "antilink" && isOwner) {
                antilink = args[0] === "on";
                await sock.sendMessage(from, { text: `🛡️ *AntiLink:* ${antilink ? 'ENABLED ✅' : 'DISABLED ❌'}` });
            }

            else if (commandName === "gstatut" && isOwner) {
                const statusText = args.join(" ");
                if (!statusText) return sock.sendMessage(from, { text: "Provide a message!" });
                const groups = await sock.groupFetchAllParticipating();
                const groupIds = Object.keys(groups);
                await sock.sendMessage(from, { text: `Broadcasting to ${groupIds.length} groups...` });
                for (let id of groupIds) {
                    await sock.sendMessage(id, { text: statusText });
                    await new Promise(r => setTimeout(r, 2000));
                }
                await sock.sendMessage(from, { text: "✅ Done!" });
            }

            else if (commands[commandName]) {
                await commands[commandName](sock, m, args);
            }
        } catch (e) { console.log(e) }
    })
}

startBot().catch(err => console.log(err))
