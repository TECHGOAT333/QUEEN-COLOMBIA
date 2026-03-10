const yts = require('yt-search');
const axios = require('axios');

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const searchQuery = args.join(" ");

    if (!searchQuery) {
        return await sock.sendMessage(chatId, { 
            text: "👑 *QUEEN COLAMBIA*\n\nKi mizik ou vle m telechaje pou ou?"
        }, { quoted: m });
    }

    try {
        // 1. Chèche mizik la sou YouTube
        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return await sock.sendMessage(chatId, { text: "❌ Mwen pa jwenn anyen pou rechèch sa a." });
        }

        const video = videos[0];
        const urlYt = video.url;

        // 2. Voye mesaj ap prepare a
        await sock.sendMessage(chatId, {
            text: `⏳ _M ap prepare telechajman pou:_ \n*${video.title}*...`
        }, { quoted: m });

        // 3. Rele API a (Keith API)
        const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`);
        const data = response.data;

        // Tcheke si API a voye done yo kòrèkteman
        if (!data || data.status !== "success" || !data.result || !data.result.downloadUrl) {
            return await sock.sendMessage(chatId, { 
                text: "❌ API a pa reponn kòrèkteman. Eseye ankò pita."
            });
        }

        const audioUrl = data.result.downloadUrl;
        const title = data.result.title || "audio";

        // 4. Voye Odyo a bay itilizatè a
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
        }, { quoted: m });

        // Reyaji ak yon emoji siksè
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error('Error in play command:', error);
        await sock.sendMessage(chatId, { 
            text: "⚠️ Download la echwe. Verifye si lyen an bon oswa si API a gen pwoblèm."
        });
    }
}
