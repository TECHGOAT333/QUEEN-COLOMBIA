module.exports = async (sock, m) => {
    const chatJid = m.key.remoteJid;

    try {
        // 1. Voye yon mesaj avètisman
        await sock.sendMessage(chatJid, { text: "🧹 *M ap netwaye tout mesaj nan chat sa a...*" }, { quoted: m });

        // 2. Efase mesaj yo nan nivo bot la
        await sock.chatModify({
            delete: true,
            lastMessages: [{ key: m.key, messageTimestamp: m.messageTimestamp }]
        }, chatJid);

        // Nòt: Nan kèk vèsyon Baileys, ou ka itilize tou:
        // await sock.sendMessage(chatJid, { delete: m.key }); 
        // Men 'chatModify' ak 'delete: true' se fason ki pi pwòp.

    } catch (err) {
        console.error("Erè nan clear chat:", err);
        await sock.sendMessage(chatJid, { text: "❌ Mwen pa ka netwaye chat sa a kounye a." });
    }
}
