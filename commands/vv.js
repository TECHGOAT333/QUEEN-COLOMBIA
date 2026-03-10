const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    
    // 1. Identify the quoted message (reply)
    const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    
    // 2. Locate the View Once content within the message layers
    const viewOnce = quoted?.viewOnceMessageV2 || quoted?.viewOnceMessage || 
                     m.message.viewOnceMessageV2 || m.message.viewOnceMessage;

    // 3. Extract the actual media content
    const actualContent = viewOnce?.message || quoted;

    // Check if it's a View Once image or video
    const isImage = actualContent?.imageMessage;
    const isVideo = actualContent?.videoMessage;

    if (!isImage && !isVideo) {
        return await sock.sendMessage(chatId, { 
            text: "❌ *Error:* Please reply to a *View Once* photo or video." 
        }, { quoted: m });
    }

    // Add a loading reaction
    await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

    try {
        const type = isImage ? 'imageMessage' : 'videoMessage';
        const media = actualContent[type];
        
        // Download the encrypted buffer
        const stream = await downloadContentFromMessage(media, isImage ? 'image' : 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const caption = `👁️ *VIEW ONCE BYPASS*\n👑 *QUEEN COLAMBIA*`;

        // Send the recovered media back
        if (isImage) {
            await sock.sendMessage(chatId, { image: buffer, caption: caption }, { quoted: m });
        } else {
            await sock.sendMessage(chatId, { video: buffer, caption: caption }, { quoted: m });
        }

        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("VV Error:", e);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: "❌ *Technical Error:* Failed to decode media." });
    }
};
