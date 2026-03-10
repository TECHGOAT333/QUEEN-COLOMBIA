module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const url = args[0];

    // Check for valid Instagram link
    if (!url || !url.includes('instagram.com')) {
        return sock.sendMessage(from, { 
            text: "亗 *QUEEN COLAMBIA* 亗\n\n❌ *Error:* Please provide a valid Instagram link.\n💡 *Usage:* .ig [link]" 
        }, { quoted: m });
    }

    // Reaction to show processing
    await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });

    try {
        // Fetching from a stable API
        const response = await fetch(`https://api.vreden.my.id/api/igdl?url=${encodeURIComponent(url)}`);
        const res = await response.json();

        if (res.result && res.result[0]) {
            const caption = 
                `┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃   📸  *INSTAGRAM DOWNLOAD* \n` +
                `┠━━━━━━━━━━━━━━━━━━┫\n` +
                `┃ ✅ *Status:* Success\n` +
                `┃ 👑 *Bot:* QUEEN COLAMBIA\n` +
                `┗━━━━━━━━━━━━━━━━━━┛`;

            await sock.sendMessage(from, { 
                video: { url: res.result[0].url }, 
                caption: caption 
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
        } else {
            throw new Error("No media found");
        }
    } catch (e) {
        await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(from, { 
            text: "❌ *Error:* Failed to download. The link might be private or the API is down." 
        }, { quoted: m });
    }
};
