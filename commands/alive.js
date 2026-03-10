module.exports = async (sock, m) => {
    // Calculate response speed
    const start = Date.now();
    const latency = Date.now() - start;

    const pingTemplate = `*───「 ＱＵＥＥＮ  ＳＴＡＴＵＳ 」───*

🚀 *Latency:* ${latency} _ms_
🛰️ *Server:* _Online_
⚙️ *Version:* _3.0.0_
💎 *System:* _Operational_

*──────────────────────*
*Queen Colambia is active and responding.*`;

    await sock.sendMessage(
        m.key.remoteJid, 
        { 
            text: pingTemplate 
        }, 
        { quoted: m }
    );
};
