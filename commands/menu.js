module.exports = async (sock, m) => {
    const { remoteJid } = m.key;
    const imageUrl = "https://files.catbox.moe/3dwe96.jpg";
    const channelUrl = "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V";
    
    // Sekirite pou m.sender
    const sender = m.sender || m.key.participant || remoteJid || "";
    const senderName = sender.includes('@') ? sender.split('@')[0] : "User";

    // Kalkile Uptime dinamik
    const seconds = process.uptime();
    const h = Math.floor(seconds / 3600);
    const min = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const uptime = `${h}h ${min}m ${s}s`;
    
    const totalCommands = 22; 

    const menu = `
*─── « 👑 QUEEN COLAMBIA » ───*

   👤 *USER:* @${senderName}
   ⌨️ *PREFIX:* .
   📊 *COMMANDS:* ${totalCommands}
   ⏳ *UPTIME:* ${uptime}
   🛠️ *DEV:* WEEDTECH

*──────────────────────*

*🤖 BOT INFO*
┃ 🚀 .ping
┃ 📡 .alive
┃ 📜 .menu
┃ 👤 .owner
┃ ⏳ .runtime

*🛠️ TOOLS*
┃ ✍️ .say
┃ 🕒 .time
┃ 📅 .date
┃ 🆔 .jid
┃ 🔄 .restart

*👮 GWOUP ADMIN*
┃ 🔨 .kick
┃ ➕ .add
┃ ⬆️ .promote
┃ ⬇️ .demote
┃ 🧹 .delete
┃ 📢 .tagall

*⚙️ REGLAJ*
┃ 🔧 .setprefix
┃ 🖼️ .setpp
┃ 🆘 .help
┃ 💬 .echo

*──────────────────────*
      *© 2026 QUEEN COLAMBIA*
    `.trim();

    try {
        await sock.sendMessage(remoteJid, { 
            image: { url: imageUrl }, 
            caption: menu,
            mentions: [sender], // Sèvi ak varyab sekirite a
            contextInfo: {
                externalAdReply: {
                    title: "QUEEN COLAMBIA OFFICIAL",
                    body: "Powered by WeedTech",
                    thumbnailUrl: imageUrl,
                    sourceUrl: channelUrl,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: m });
    } catch (e) {
        console.error("Erè nan voye menu: ", e);
    }
}
