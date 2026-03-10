
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = async (sock, m) => {
    const chatId = m.key.remoteJid;

    try {
        // 1. Check if the user replied to a message
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return await sock.sendMessage(chatId, { 
                text: "❓ *Usage:* Please reply to a **View Once** photo or video." 
            }, { quoted: m });
        }

        // 2. Identify the View Once layer (V1, V2, or direct)
        const viewOnce = quoted.viewOnceMessageV2 || quoted.viewOnceMessage || quoted;
        
        // 3. Extract the actual media content
        const messageContent = viewOnce.message || viewOnce;
        const type = Object.keys(messageContent)[0];

        // Validate if it is an image or video
        if (!type.includes('imageMessage') && !type.includes('videoMessage')) {
            return await sock.sendMessage(chatId, { 
                text: "❌ *Error:* This message does not contain a View Once image or video." 
            }, { quoted: m });
        }

        // 4. Add a loading reaction
        await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

        const media = messageContent[type];
        const stream = await downloadContentFromMessage(
            media, 
            type.replace('Message', '').replace('viewOnce', '')
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const caption = `👁️ *VIEW ONCE RECOVERED*\n👑 *QUEEN COLAMBIA V3*`;

        // 5. Send back the recovered media
        if (type.includes('image')) {
            await sock.sendMessage(chatId, { image: buffer, caption: caption }, { quoted: m });
        } else if (type.includes('video')) {
            await sock.sendMessage(chatId, { video: buffer, caption: caption }, { quoted: m });
        }

        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("VV Recovery Error:", e);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { 
            text: "⚠️ *System Error:* Failed to fetch media. The file may have expired or was already processed." 
        }, { quoted: m });
    }
};
