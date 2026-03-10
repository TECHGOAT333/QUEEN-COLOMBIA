module.exports = async (sock, m) => {
    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
    if (!text) return;

    const isLink = /chat.whatsapp.com/i;
    const from = m.key.remoteJid;

    if (!from.endsWith('@g.us')) return;

    const sender = m.key.participant || m.key.remoteJid;

    if (isLink.test(text)) {
        try {
            // 1. Tcheke si se pa bot la k ap pale
            if (m.key.fromMe) return;

            // 2. Jwenn enfòmasyon sou gwoup la pou wè kilès ki admin
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;
            const admins = participants.filter(p => p.admin !== null).map(p => p.id);
            
            const isBotAdmin = admins.includes(sock.user.id.split(':')[0] + '@s.whatsapp.net');
            const isSenderAdmin = admins.includes(sender);

            // 3. Si moun ki voye l la se admin, bot la pa fè anyen
            if (isSenderAdmin) return;

            // 4. Si bot la pa admin, li voye yon alèt sèlman
            if (!isBotAdmin) {
                return await sock.sendMessage(from, { text: "🚨 Mwen detekte yon link, men mwen pa ka kick moun nan. Mete m *ADMIN* tanpri!" });
            }

            // 5. Egzekite sanksyon an (Delete + Kick)
            await sock.sendMessage(from, { delete: m.key });
            await sock.groupParticipantsUpdate(from, [sender], "remove");

            await sock.sendMessage(from, { 
                text: `🚫 *AntiLink detekte!*\n\n@${sender.split('@')[0]} retire paske li voye link gwoup san otorizasyon.`,
                mentions: [sender]
            });

        } catch (err) {
            console.log("Erè AntiLink:", err);
        }
    }
};
