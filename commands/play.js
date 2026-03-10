const yts = require('yt-search');

module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const query = args.join(" ");
    if (!query) return sock.sendMessage(from, { text: "❓ Tanpri mete non yon mizik oswa yon lyen YouTube." }, { quoted: m });

    try {
        const search = await yts(query);
        const video = search.videos[0];
        if (!video) return sock.sendMessage(from, { text: "❌ Mwen pa jwenn anyen." });

        let caption = `
*╭───〔 🎧 PLAY MUSIC 〕───⭐*
│
│ 📌 *Tit:* ${video.title}
│ 🕒 *Dire:* ${video.timestamp}
│ 👁️ *Vues:* ${video.views}
│ 🔗 *Link:* ${video.url}
│
*╰──────────────⭐*
_M ap prepare odyo a pou ou..._`;

        await sock.sendMessage(from, { image: { url: video.thumbnail }, caption }, { quoted: m });

        // Isit la ou ka konekte yon API pou voye MP3 a otomatikman
    } catch (e) {
        console.error(e);
        sock.sendMessage(from, { text: "❌ Erè nan rechèch la." });
    }
}
