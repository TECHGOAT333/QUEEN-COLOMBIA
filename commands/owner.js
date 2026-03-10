module.exports = async (sock, m) => {
    // Nimewo WeedDev dirèkteman
    const ownerNumber = "50939032060"; 
    const devName = "WeedDev"; 

    // 1. Kreye fòma VCard (Kat Vizit) la
    const vcard = 'BEGIN:VCARD\n'
        + 'VERSION:3.0\n' 
        + `FN:${devName}\n` 
        + `ORG:Queen Colambia Bot;\n`
        + `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}\n`
        + 'END:VCARD';

    // 2. Voye Kat Vizit la (VCard)
    await sock.sendMessage(
        m.key.remoteJid,
        { 
            contacts: { 
                displayName: devName, 
                contacts: [{ vcard }] 
            }
        },
        { quoted: m }
    );

    // 3. Mesaj enfòmasyon an modèn epi klè
    const ownerMessage = `
*╭───〔 👑 OWNER INFO 〕───⭐*
│
│ 👤 *Developer:* ${devName}
│ 📱 *Contact:* wa.me/${ownerNumber}
│ 🤖 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*

_Klike sou kat la pou sove kontak mwen, oswa sou lyen an pou ekri m._
    `.trim();

    await sock.sendMessage(m.key.remoteJid, { 
        text: ownerMessage,
        mentions: [ownerNumber + '@s.whatsapp.net'] 
    }, { quoted: m });
}
