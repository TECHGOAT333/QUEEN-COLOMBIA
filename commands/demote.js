module.exports = async (sock, m) => {
    const { remoteJid } = m.key;

    // 1. Tcheke si se nan yon gwoup ou ye
    if (!remoteJid.endsWith('@g.us')) {
        return await sock.sendMessage(remoteJid, { text: "❌ This command only works in groups." }, { quoted: m });
    }

    // 2. Jwenn moun w ap demote a (swa nan mention @, swa nan reply)
    let user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
               m.message?.extendedTextMessage?.contextInfo?.participant;

    if (!user) {
        return await sock.sendMessage(remoteJid, { text: "❓ Please mention (@) an Admin or reply to their message to demote them." }, { quoted: m });
    }

    try {
        // 3. Egzekite aksyon "demote" nan Baileys
        await sock.groupParticipantsUpdate(remoteJid, [user], "demote");

        // 4. Konfimasyon bèl ak pwòp
        const response = `
*╭───〔 👮 ADMIN ACTION 〕───⭐*
│
│ 👤 *User:* @${user.split('@')[0]}
│ 📉 *Status:* Demoted to Member
│ 🤖 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*
        `.trim();

        await sock.sendMessage(remoteJid, { 
            text: response, 
            mentions: [user] 
        }, { quoted: m });

    } catch (err) {
        await sock.sendMessage(remoteJid, { 
            text: "⚠️ *ERROR:* I need to be an **Admin** to demote someone, or the user is already a member." 
        }, { quoted: m });
        console.error(err);
    }
}
