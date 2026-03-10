const axios = require("axios");
const yts = require("yt-search");

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const query = args.join(" ");

    if (!query) {
        return await sock.sendMessage(chatId, {
            text: "👑 *QUEEN COLAMBIA*\n\n⚠️ Tanpri mete yon lyen YouTube oswa non yon mizik.\n\n*Egzanp:* .ytmp3 Bob Marley Is This Love"
        }, { quoted: m });
    }

    try {
        let videoUrl = query;

        // 1. Reyaji pou montre bot la ap chèche
        await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

        // 2. Si se pa yon lyen, nou chèche l sou YouTube
        if (!query.includes("youtube.com") && !query.includes("youtu.be")) {
            const search = await yts(query);
            if (!search.videos || search.videos.length === 0) {
                return await sock.sendMessage(chatId, { text: `❌ Mwen pa jwenn anyen pou: ${query}` });
            }
            videoUrl = search.videos[0].url;
        }

        // 3. Rele API David Cyril la
        const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const response = await axios.get(apiUrl);
        const data = response.data?.result;

        if (!data || !data.download_url) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
            return await sock.sendMessage(chatId, { text: "❌ API a pa ka jwenn odyo a. Eseye ankò pita." });
        }

        // 4. Voye Odyo a ak bèl prezantasyon
        await sock.sendMessage(chatId, {
            audio: { url: data.download_url },
            mimetype: "audio/mpeg",
            fileName: `${data.title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: data.title,
                    body: "QUEEN COLAMBIA MUSIC",
                    thumbnailUrl: data.thumbnail,
                    sourceUrl: videoUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

        // 5. Reaction final
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Erè YTPlay:", error.message);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: "❌ Yon erè rive. Verifye koneksyon API a." });
    }
};
