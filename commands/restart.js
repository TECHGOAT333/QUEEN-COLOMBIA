module.exports = async (sock, m) => {

    const { remoteJid } = m.key;

    // Voye mesaj la an premye
    await sock.sendMessage(remoteJid, { 
        text: "♻️ *QUEEN COLAMBIA REBOOTING...*\nPlease wait a moment while I restart my systems." 
    }, { quoted: m });

    // Tann 2 segonn (2000ms) pou asire mesaj la pati anvan bot la "mouri"
    setTimeout(() => {
        process.exit(); 
    }, 2000);

}
