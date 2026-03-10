
module.exports = async (sock, m) => {
    // 1. Jwenn tèks mesaj la byen
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
    if (!text) return;

    const isLink = /chat.whatsapp.com/i;
    const from = m.key.remoteJid;

    // Tcheke si se nan yon gwoup (antilink pa mache nan inbox)
    if (!from.endsWith('@g.us')) return;

    // 2. Jwenn moun ki voye mesaj la
    const sender = m.key.participant || m.key.remoteJid;

    if (isLink.test(text)) {
        try {
            // Pa efase si se bot la oswa si se yon admin (opsyonèl)
            if (!m.key.fromMe) {
                
                // Efase mesaj la an premye
                await sock.sendMessage(from, { delete: m.key });

                // Kick moun nan
                await sock.groupParticipantsUpdate(from, [sender], "remove");

                // Voye mesaj alèt la
                await sock.sendMessage(from, { 
                    text: `🚫 *AntiLink detekte!*\n\n@${sender.split('@')[0]} retire paske li voye link gwoup.`,
                    mentions: [sender]
                });
            }
        } catch (err) {
            console.log("Erè AntiLink:", err);
            // Si sa bay erè, se souvan paske bot la pa ADMIN
            await sock.sendMessage(from, { text: "🚨 Mwen detekte yon link, men mwen pa ka kick moun nan. Mete m ADMIN tanpri!" });
        }
    }
};
