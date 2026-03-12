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

const dbPath = path.join(__dirname, "database.json");

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
            await sock.sendMessage(ownerJid, { text: "✨ *QUEEN COLAMBIA IS ONLINE* ✨" })
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
        const text = (m.message.conversation || m.message.extendedTextMessage?.text || "").trim()
        const prefix = settings.prefix || "."
        const isOwner = sender.includes(settings.ownerNumber.replace(/[^0-9]/g, '')) || m.key.fromMe

        // --- PERSISTENT ANTILINK SYSTEM ---
        if (isGroup && text) {
            let db = { antilink: [] };
            if (fs.existsSync(dbPath)) {
                try { db = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch (e) { db = { antilink: [] }; }
            }

            // Si se nan gwoup sa a ou te limen AntiLink la
            if (db.antilink.includes(from)) {
                const linkRegex = /chat.whatsapp.com\/|https?:\/\//gi;
                if (linkRegex.test(text)) {
                    try {
                        const groupMetadata = await sock.groupMetadata(from)
                        const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id)
                        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net'
                        const isBotAdmin = admins.includes(botId)
                        const isSenderAdmin = admins.includes(sender)

                        // Sèlman si se pa yon admin/owner ki voye l epi bot la se admin
                        if (!isSenderAdmin && !isOwner && isBotAdmin) {
                            await sock.sendMessage(from, { delete: m.key })
                            await sock.sendMessage(from, { 
                                text: `🚫 *Link Detected:* @${sender.split('@')[0]}, links are strictly forbidden here!`, 
                                mentions: [sender] 
                            })
                        }
                    } catch (e) { console.error("AntiLink Error:", e) }
                }
            }
        }

        if (!text.startsWith(prefix)) return
        const args = text.slice(prefix.length).trim().split(/ +/)
        const commandName = args.shift().toLowerCase()

        try {
            // --- COMMAND: ANTILINK (OWNER ONLY) ---
            if (commandName === "antilink") {
                if (!isOwner) return await sock.sendMessage(from, { text: "❌ *Access Denied:* Only the Bot Owner can enable/disable AntiLink." });

                let db = { antilink: [] };
                if (fs.existsSync(dbPath)) {
                    try { db = JSON.parse(fs.readFileSync(dbPath, "utf-8")); } catch (e) { db = { antilink: [] }; }
                }

                if (args[0] === "on") {
                    if (!db.antilink.includes(from)) {
                        db.antilink.push(from);
                        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                    }
                    await sock.sendMessage(from, { text: "🛡️ *AntiLink:* Activated for this group! ✅" });
                } else if (args[0] === "off") {
                    db.antilink = db.antilink.filter(id => id !== from);
                    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                    await sock.sendMessage(from, { text: "🛡️ *AntiLink:* Deactivated for this group! ❌" });
                } else {
                    await sock.sendMessage(from, { text: `Usage: ${prefix}antilink on/off` });
                }
            }
            
            // --- OTHER COMMANDS ---
            else if (commands[commandName]) {
                await commands[commandName](sock, m, args);
            }
        } catch (e) { console.log(e) }
    })
}

startBot().catch(err => console.log(err))
