const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    
    // Tcheke si mesaj la se yon "View Once" oswa si w ap site (reply) youn
    const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const viewOnce = m.message.viewOnceMessageV2 || m.message.viewOnceMessage || quoted?.viewOnceMessageV2 || quoted?.viewOnceMessage;

    if (!viewOnce) {
        return await sock.sendMessage(chatId, { 
            text: "❌ *Error:* Please reply to a View Once message (Photo/Video)." 
        }, { quoted: m });
    }

    await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

    try {
        const type = Object.keys(viewOnce.message)[0]; // Jwenn si se imageMessage oswa videoMessage
        const media = viewOnce.message[type];
        
        // Telechaje kontni an
        const stream = await downloadContentFromMessage(media, type === 'imageMessage' ? 'image' : 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const caption = 
            `┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃   👁️  *VIEW ONCE BYPASS* \n` +
            `┠━━━━━━━━━━━━━━━━━━┫\n` +
            `┃ ✅ *Status:* Recovered\n` +
            `┃ 👑 *Bot:* QUEEN COLAMBIA\n` +
            `┗━━━━━━━━━━━━━━━━━━┛`;

        if (type === 'imageMessage') {
            await sock.sendMessage(chatId, { image: buffer, caption: caption }, { quoted: m });
        } else if (type === 'videoMessage') {
            await sock.sendMessage(chatId, { video: buffer, caption: caption }, { quoted: m });
        }

        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("VV Error:", e);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: "❌ *Error:* I couldn't download this media." });
    }
};
