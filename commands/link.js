module.exports = async (sock, m) => {
    const chatJid = m.key.remoteJid;

    // 1. Tcheke si se nan yon gwoup
    if (!chatJid.endsWith('@g.us')) {
        return await sock.sendMessage(chatJid, { text: "❌ Kòmand sa fèt pou gwoup sèlman!" }, { quoted: m });
    }

    try {
        // 2. Rekipere kòd envitasyon gwoup la
        const code = await sock.groupInviteCode(chatJid);
        const groupLink = `https://chat.whatsapp.com/${code}`;

        const response = `
*╭───〔 🔗 GROUP LINK 〕───⭐*
│
│ 📌 *Link:* ${groupLink}
│ 👑 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*
        `.trim();

        // 3. Voye lyen an
        await sock.sendMessage(chatJid, { 
            text: response,
            contextInfo: {
                externalAdReply: {
                    title: "GROUP INVITATION",
                    body: "Klike pou w antre nan gwoup la",
                    thumbnailUrl: "https://files.catbox.moe/3dwe96.jpg",
                    sourceUrl: groupLink,
                    mediaType: 1
                }
            }
        }, { quoted: m });

    } catch (err) {
        console.error("Erè nan link group:", err);
        await sock.sendMessage(chatJid, { text: "⚠️ Mwen pa ka jwenn lyen an. Asire m se Admin mwen ye!" }, { quoted: m });
    }
}
