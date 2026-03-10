module.exports = async (sock, m) => {
    // 1. Sekirite pou sender (Pou evite erè 'split' la)
    const sender = m.sender || m.key.participant || m.key.remoteJid || "";
    const pushName = sender.split('@')[0] || "User";

    // 2. Fonksyon Runtime
    function runtime(seconds) {
        seconds = Number(seconds);
        var d = Math.floor(seconds / (3600 * 24));
        var h = Math.floor(seconds % (3600 * 24) / 3600);
        var m = Math.floor(seconds % 3600 / 60);
        var s = Math.floor(seconds % 60);
        return `${d > 0 ? d + "d " : ""}${h > 0 ? h + "h " : ""}${m > 0 ? m + "m " : ""}${s}s`;
    }

    const uptime = runtime(process.uptime());
    const totalCommands = 29;

    const menu = `
*╭───〔 👑 QUEEN COLAMBIA 〕───⭐*
│ 👤 *USER:* @${pushName}
│ ⌨️ *PREFIX:* .
│ 📊 *COMMANDS:* ${totalCommands}
│ ⏳ *UPTIME:* ${uptime}
│ 🛠️ *DEV:* 𝐖𝐞𝐞𝐝
*╰──────────────⭐*

*📜 COMMAND LIST:*

*┣━〔 🤖 BOT INFO 〕*
┃ 🚀 .ping
┃ 📡 .alive
┃ 📜 .menu
┃ 👤 .owner
┃ ⏳ .runtime
┃ 📊 .status
┃ 🖥️ .system

*┣━〔 🛠 TOOLS 〕*
┃ ✍️ .say
┃ 🕒 .time
┃ 📅 .date
┃ 🆔 .jid
┃ 🔄 .restart
┃ 🔍 .search
┃ 🎥 .ytmp4
┃ 🎵 .ytmp3
┃ 📸 .igdl
┃ 🐦 .twitter
┃ 🌐 .translate

*┣━〔 👮 GROUP ADMIN 〕*
┃ 🔨 .kick
┃ ➕ .add
┃ ⬆️ .promote
┃ ⬇️ .demote
┃ 🧹 .delete
┃ 📢 .tagall
┃ 🔓 .open
┃ 🔒 .close
┃ 🔗 .link
┃ 🚫 .hidetag

*┣━〔 ⚙️ SETTINGS 〕*
┃ 🔧 .setprefix
┃ 🖼️ .setpp
┃ 🆘 .help
┃ 💬 .echo
┃ 🔔 .welcome
┃ 🔕 .goodbye

*© 2026 QUEEN COLAMBIA*
    `.trim();

    await sock.sendMessage(m.key.remoteJid, {
        image: { url: "https://files.catbox.moe/3dwe96.jpg" }, 
        caption: menu,
        mentions: [sender], 
        contextInfo: {
            externalAdReply: {
                title: "QUEEN COLAMBIA OFFICIAL",
                body: "Join our channel for updates",
                thumbnailUrl: "https://files.catbox.moe/3dwe96.jpg",
                sourceUrl: "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V", 
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m });
};
