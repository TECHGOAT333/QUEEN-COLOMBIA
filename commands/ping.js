module.exports = async (sock, m) => {
    // Kalkile vitès la an milisegonn (ms)
    const start = Date.now();
    const ping = Date.now() - start;

    const pingMessage = `
*🚀 QUEEN COLAMBIA SPEED*

*🏓 Pong:* ${ping}ms
*📡 Status:* Online
*⚡ Response:* Super Fast

_Everything is running smoothly!_
    `.trim();

    await sock.sendMessage(m.key.remoteJid, { 
        text: pingMessage,
        contextInfo: {
            externalAdReply: {
                title: "BOT PERFORMANCE",
                body: `Latency: ${ping}ms`,
                thumbnailUrl: "https://files.catbox.moe/zdk50s.jpg", // Foto bot ou a
                sourceUrl: "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V",
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m });
}
