module.exports = async (sock, m) => {
    const chatJid = m.key.remoteJid;

    // 1. Tcheke si se nan yon gwoup
    if (!chatJid.endsWith('@g.us')) {
        return await sock.sendMessage(chatJid, { text: "❌ Kòmand sa fèt pou gwoup sèlman!" }, { quoted: m });
    }

    try {
        // 2. Louvri gwoup la (not_announcement vle di tout moun ka pale)
        await sock.groupSettingUpdate(chatJid, 'not_announcement');

        const response = `
*╭───〔 🔓 GROUP OPENED 〕───⭐*
│
│ 📢 *Status:* Tout moun ka voye mesaj kounye a.
│ 👮 *By:* @${(m.sender || "").split('@')[0]}
│ 🤖 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*
        `.trim();

        await sock.sendMessage(chatJid, { text: response, mentions: [m.sender] }, { quoted: m });

    } catch (err) {
        console.error("Erè nan open group:", err);
        await sock.sendMessage(chatJid, { text: "⚠️ Mwen bezwen pèmisyon Admin pou m louvri gwoup la!" }, { quoted: m });
    }
}
