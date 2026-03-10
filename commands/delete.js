module.exports = async (sock, m) => {
    const { remoteJid } = m.key;

    // 1. Tcheke si gen yon mesaj ki te replied (quoted)
    const quoted = m.message?.extendedTextMessage?.contextInfo;
    
    if (!quoted || !quoted.stanzaId) {
        return await sock.sendMessage(remoteJid, { 
            text: "❓ *Please reply to the message you want to delete.*" 
        }, { quoted: m });
    }

    try {
        // 2. Prepare enfòmasyon pou efase a
        const keyToDelete = {
            remoteJid: remoteJid,
            fromMe: quoted.participant === sock.user.id.split(':')[0] + '@s.whatsapp.net', 
            id: quoted.stanzaId,
            participant: quoted.participant // Trè enpòtan pou mesaj nan gwoup
        };

        // 3. Egzekite efase a
        await sock.sendMessage(remoteJid, { delete: keyToDelete });

    } catch (err) {
        await sock.sendMessage(remoteJid, { 
            text: "⚠️ *ERROR:* I need to be an **Admin** to delete other people's messages." 
        }, { quoted: m });
        console.error(err);
    }
}
