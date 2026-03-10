module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const searchQuery = args.join(" ");

    if (!searchQuery) {
        return await sock.sendMessage(chatId, { 
            text: "👑 *QUEEN COLAMBIA*\n\nKi mizik ou vle m telechaje pou ou?"
        }, { quoted: m });
    }

    // Reaction ⏳
    await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

    try {
        // 1. Chèche mizik la via yon API rechèch piblik (pou evite yt-search)
        const searchApi = `https://api.vreden.my.id/api/ytsearch?query=${encodeURIComponent(searchQuery)}`;
        const searchRes = await fetch(searchApi);
        const searchData = await searchRes.json();

        if (!searchData.result || searchData.result.length === 0) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
            return await sock.sendMessage(chatId, { text: "❌ Mwen pa jwenn okenn rezilta." });
        }

        const video = searchData.result[0];
        const urlYt = video.url;

        // 2. Rele API Keith pou download (itilize fetch)
        const downloadApi = `https://apis-keith.vercel.app/download/dlmp3?url=${encodeURIComponent(urlYt)}`;
        const dlRes = await fetch(downloadApi);
        const data = await dlRes.json();

        if (data.status !== "success" || !data.result || !data.result.downloadUrl) {
            await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
            return await sock.sendMessage(chatId, { text: "❌ API a gen yon ti pwoblèm. Eseye ankò pita." });
        }

        const audioUrl = data.result.downloadUrl;
        const title = data.result.title || "audio";

        // 3. Voye Odyo a
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
        }, { quoted: m });

        // Reaction ✅
        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error('Error in play command:', error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: "⚠️ Erè rive pandan telechajman an. Eseye pita." });
    }
}
