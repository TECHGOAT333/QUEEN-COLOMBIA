
module.exports = async (sock, m) => {
    const chatJid = m.key.remoteJid;

    // 1. Tcheke si se nan gwoup
    if (!chatJid.endsWith('@g.us')) {
        return await sock.sendMessage(chatJid, { text: "❌ Kòmand sa fèt pou gwoup sèlman!" }, { quoted: m });
    }

    try {
        // 2. Rekipere metadata gwoup la pou tcheke admin yo
        const groupMetadata = await sock.groupMetadata(chatJid);
        const participants = groupMetadata.participants;
        
        // Lis tout moun ki admin nan gwoup la
        const groupAdmins = participants.filter(p => p.admin !== null).map(p => p.id);
        
        // Tcheke si moun ki voye mesaj la (m.sender) se admin
        const isSenderAdmin = groupAdmins.includes(m.sender);

        // BLOKAJ: Si se pa yon admin ki tape kòmand lan, bot la sispann la
        if (!isSenderAdmin) {
            return await sock.sendMessage(chatJid, { text: "❌ Aksè refize! Se admin sèlman ki ka monte moun grad." }, { quoted: m });
        }

        // 3. Jwenn moun n ap bay grad la (swa nan @, swa nan reply)
        let user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                   m.message?.extendedTextMessage?.contextInfo?.participant;

        if (!user) {
            return await sock.sendMessage(chatJid, { text: "❓ Tag (@) moun nan oswa fè yon reply sou mesaj li pou w ba l grad." }, { quoted: m });
        }

        // 4. Bay moun nan grad Admin
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
        // Erè sa a rive souvan si bot la li menm pa admin
        await sock.sendMessage(chatJid, { text: "⚠️ Erè: Asire w bot la se Admin nan gwoup la pou l ka fè aksyon sa!" }, { quoted: m });
        console.error(err);
    }
}
