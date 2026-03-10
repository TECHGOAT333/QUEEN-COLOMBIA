module.exports = async (sock, m) => {
    const chatJid = m.key.remoteJid;

    // Lojik ki pi solid pou tcheke si se yon gwoup (Group Chat)
    const isGroup = chatJid.endsWith('@g.us');

    if (!isGroup) {
        return await sock.sendMessage(chatJid, { 
            text: "❌ Kòmand sa fèt pou gwoup sèlman!" 
        }, { quoted: m });
    }

    // Rès kòd pou kick la...
    let user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
               m.message?.extendedTextMessage?.contextInfo?.participant;

    if (!user) {
        return await sock.sendMessage(chatJid, { text: "❓ Mentionne moun ou vle retire a." }, { quoted: m });
    }

    try {
        await sock.groupParticipantsUpdate(chatJid, [user], "remove");
        await sock.sendMessage(chatJid, { text: "✅ Itilizatè a retire ak siksè." }, { quoted: m });
    } catch (e) {
        await sock.sendMessage(chatJid, { text: "⚠️ Mwen bezwen pèmisyon Admin!" }, { quoted: m });
    }
}
