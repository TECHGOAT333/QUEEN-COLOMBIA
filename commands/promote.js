module.exports = async (sock, m) => {
    const chatJid = m.key.remoteJid;

    // 1. Tcheke si se nan gwoup
    if (!chatJid.endsWith('@g.us')) {
        return await sock.sendMessage(chatJid, { text: "❌ Kòmand sa fèt pou gwoup sèlman!" }, { quoted: m });
    }

    // 2. Jwenn moun w ap bay grad la (swa nan @, swa nan reply)
    let user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
               m.message?.extendedTextMessage?.contextInfo?.participant;

    if (!user) {
        return await sock.sendMessage(chatJid, { text: "❓ Tag (@) moun nan oswa fè yon reply sou mesaj li pou w ba l grad." }, { quoted: m });
    }

    try {
        // 3. Bay moun nan grad Admin
        await sock.groupParticipantsUpdate(chatJid, [user], "promote");

        const response = `
*╭───〔 👮 ADMIN ACTION 〕───⭐*
│
│ 👤 *User:* @${user.split('@')[0]}
│ 📈 *Status:* Promoted to Admin
│ 🤖 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*
        `.trim();

        await sock.sendMessage(chatJid, { text: response, mentions: [user] }, { quoted: m });

    } catch (err) {
        await sock.sendMessage(chatJid, { text: "⚠️ Mwen bezwen pèmisyon Admin pou m bay grad!" }, { quoted: m });
    }
}
