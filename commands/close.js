module.exports = async (sock, m) => {
    const chatJid = m.key.remoteJid;

    // 1. Tcheke si se nan yon gwoup
    if (!chatJid.endsWith('@g.us')) {
        return await sock.sendMessage(chatJid, { text: "❌ Kòmand sa fèt pou gwoup sèlman!" }, { quoted: m });
    }

    try {
        // 2. Fèmen gwoup la (announcement vle di Admin sèlman)
        await sock.groupSettingUpdate(chatJid, 'announcement');

        const response = `
*╭───〔 🔒 GROUP CLOSED 〕───⭐*
│
│ 📢 *Status:* Se Admin sèlman ki ka pale kounye a.
│ 👮 *By:* @${(m.sender || "").split('@')[0]}
│ 🤖 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*
        `.trim();

        await sock.sendMessage(chatJid, { text: response, mentions: [m.sender] }, { quoted: m });

    } catch (err) {
        console.error("Erè nan close group:", err);
        await sock.sendMessage(chatJid, { text: "⚠️ Mwen bezwen pèmisyon Admin pou m fèmen gwoup la!" }, { quoted: m });
    }
}
