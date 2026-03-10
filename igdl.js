const axios = require('axios');

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const url = args[0];

    if (!url || !url.includes('instagram.com')) {
        return sock.sendMessage(from, { text: "🔗 Tanpri mete yon lyen Instagram valid (Reels oswa Post)." }, { quoted: m });
    }

    // Reaction ⏳
    await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });

    try {
        // API David Cyril pou Instagram
        const apiUrl = `https://apis.davidcyriltech.my.id/download/igdl?url=${encodeURIComponent(url)}`;
        const res = await axios.get(apiUrl);
        
        // David Cyril API konn voye yon lis (Array) paske yon pòs ka gen plizyè videyo
        const result = res.data.result; 

        if (!result || result.length === 0) {
            return sock.sendMessage(from, { text: "❌ Mwen pa jwenn okenn medya nan lyen sa a." });
        }

        // Nou voye premye videyo/foto li jwenn nan lis la
        const mediaUrl = result[0].url || result[0].download_url;

        await sock.sendMessage(from, { 
            video: { url: mediaUrl }, 
            caption: `👑 *QUEEN COLAMBIA*\n\n✅ Men Instagram ou a!` 
        }, { quoted: m });

        // Reaction ✅
        await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("IGDL Error:", e);
        sock.sendMessage(from, { text: "❌ Erè rive pandan m t ap telechaje sa a." });
    }
}
