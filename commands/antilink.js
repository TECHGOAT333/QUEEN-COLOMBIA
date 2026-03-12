module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = m.key.participant || m.key.remoteJid;
    const settings = require("../settings");
    const isOwner = sender.includes(settings.ownerNumber.replace(/[^0-9]/g, '')) || m.key.fromMe;

    if (!isGroup) return sock.sendMessage(from, { text: "This command can only be used in groups." });
    if (!isOwner) return sock.sendMessage(from, { text: "This command is for the bot owner only." });

    if (!args[0]) return sock.sendMessage(from, { text: "Usage: .antilink on/off" });

    if (args[0] === "on") {
        // This will enable it for the current session
        sock.sendMessage(from, { text: "🛡️ AntiLink has been enabled for this session." });
    } else if (args[0] === "off") {
        sock.sendMessage(from, { text: "🛡️ AntiLink has been disabled." });
    }
};
