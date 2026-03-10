const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    
    // Tcheke tout kote View Once la ka ye (nan mesaj la menm oswa nan sa w reply a)
    const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const viewOnce = m.message.viewOnceMessageV2 || m.message.viewOnceMessage || 
                     quoted?.viewOnceMessageV2 || quoted?.viewOnceMessage ||
                     m.message.extendedTextMessage?.contextInfo?.quotedMessage?.viewOnceMessageV2;

    if (!viewOnce) {
        return await sock.sendMessage(chatId, { 
            text: "❌ *Error:* Reponn yon mesaj *View Once* (Foto/Videyo)!" 
        }, { quoted: m });
    }

    await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

    try {
        // Jwenn kontni an anndan viewOnceMessageV2 a
        const actualMessage = viewOnce.message || viewOnce;
        const type = Object.keys(actualMessage)[0]; 
        const media = actualMessage[type];
        
        const stream = await downloadContentFromMessage(media, type === 'imageMessage' ? 'image' : 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const caption = `👁️ *VIEW ONCE BYPASS* \n✅ *Status:* Recovered\n👑 *Bot:* QUEEN COLAMBIA`;

        if (type === 'imageMessage') {
            await sock.sendMessage(chatId, { image: buffer, caption: caption }, { quoted: m });
        } else if (type === 'videoMessage') {
            await sock.sendMessage(chatId, { video: buffer, caption: caption }, { quoted: m });
        }

        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("VV Error:", e);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: "❌ *Erè:* Mwen pa ka telechaje medya sa a." });
    }
};
