const axios = require('axios');

module.exports = async (sock, m, args) => {
    const text = args.slice(1).join(" ");
    const lang = args[0]; // Egzanp: .translate en Bonjou

    if (!text || !lang) return sock.sendMessage(m.key.remoteJid, { text: "Fòma: .translate [lang] [tèks]\nEgzanp: .translate en Bonjou" });

    try {
        const res = await axios.get(`https://api.popcat.xyz/translate?to=${lang}&text=${encodeURIComponent(text)}`);
        await sock.sendMessage(m.key.remoteJid, { text: `🌎 *TRADIKSYON:* \n\n${res.data.translated}` }, { quoted: m });
    } catch (e) {
        sock.sendMessage(m.key.remoteJid, { text: "❌ Erè nan tradiksyon an." });
    }
}
