const axios = require('axios');

module.exports = async (sock, m, args) => {
    const url = args[0];
    if (!url) return sock.sendMessage(m.key.remoteJid, { text: "🔗 Mete lyen Twitter (X) la!" });

    await sock.sendMessage(m.key.remoteJid, { react: { text: "🐦", key: m.key } });

    try {
        const res = await axios.get(`https://apis.davidcyriltech.my.id/download/twitter?url=${encodeURIComponent(url)}`);
        const data = res.data.result;

        await sock.sendMessage(m.key.remoteJid, { 
            video: { url: data.video_url }, 
            caption: `✅ *Twitter Video*\n\n📌 *Desc:* ${data.description || "No title"}` 
        }, { quoted: m });

        await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
    } catch (e) {
        sock.sendMessage(m.key.remoteJid, { text: "❌ Erè: Lyen an pa valid oswa API a gen pwoblèm." });
    }
}
