module.exports = async (sock, m) => {
    // Fonksyon pou kalkile Runtime lan tout bon
    function runtime(seconds) {
        seconds = Number(seconds);
        var d = Math.floor(seconds / (3600 * 24));
        var h = Math.floor(seconds % (3600 * 24) / 3600);
        var m = Math.floor(seconds % 3600 / 60);
        var s = Math.floor(seconds % 60);
        var dDisplay = d > 0 ? d + "d " : "";
        var hDisplay = h > 0 ? h + "h " : "";
        var mDisplay = m > 0 ? m + "m " : "";
        var sDisplay = s > 0 ? s + "s" : "";
        return dDisplay + hDisplay + mDisplay + sDisplay || "0s";
    }

    const uptime = runtime(process.uptime());
    const totalCommands = 29;

    const menu = `
*╭───〔 👑 QUEEN COLAMBIA 〕───⭐*
│ 👤 *USER:* @${m.sender.split('@')[0]}
│ ⌨️ *PREFIX:* .
│ 📊 *COMMANDS:* ${totalCommands}
│ ⏳ *UPTIME:* ${uptime}
│ 🛠️ *DEV:* WEEDTECH
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
        mentions: [m.sender], 
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
