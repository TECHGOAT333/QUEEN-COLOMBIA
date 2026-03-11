module.exports = async (sock, m) => {
    // 1. Security and Dynamic Prefix Detection
    const sender = m.sender || m.key.participant || m.key.remoteJid || "";
    const pushName = sender.split('@')[0] || "User";

    /* This detects the prefix you used to call the menu (e.g., if you type #menu, prefix becomes #) */
    const text = m.body || "";
    const prefix = text.charAt(0); 

    // 2. Runtime Function
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
│ ⌨️ *PREFIX:* ${prefix}
│ 📊 *COMMANDS:* ${totalCommands}
│ ⏳ *UPTIME:* ${uptime}
│ 🛠️ *DEV:* 𝐖𝐞𝐞𝐝
*╰──────────────⭐*

*📜 COMMAND LIST:*

*┣━〔 🤖 BOT INFO 〕*
┃ 🚀 ${prefix}ping
┃ 📡 ${prefix}alive
┃ 📜 ${prefix}menu
┃ 👤 ${prefix}owner
┃ ⏳ ${prefix}runtime
┃ 📊 ${prefix}status
┃ 🖥️ ${prefix}system

*┣━〔 🛠 TOOLS 〕*
┃ ✍️ ${prefix}say
┃ 🕒 ${prefix}time
┃ 📅 ${prefix}date
┃ 🆔 ${prefix}jid
┃ 🔄 ${prefix}restart
┃ 🔍 ${prefix}search
┃ 🎥 ${prefix}ytmp4
┃ 🎵 ${prefix}ytmp3
┃ 📸 ${prefix}igdl
┃ 🐦 ${prefix}twitter
┃ 🌐 ${prefix}translate

*┣━〔 👮 GROUP ADMIN 〕*
┃ 🔨 ${prefix}kick
┃ ➕ ${prefix}add
┃ ⬆️ ${prefix}promote
┃ ⬇️ ${prefix}demote
┃ 🧹 ${prefix}delete
┃ 📢 ${prefix}tagall
┃ 🔓 ${prefix}open
┃ 🔒 ${prefix}close
┃ 🔗 ${prefix}link
┃ 🚫 ${prefix}hidetag

*┣━〔 ⚙️ SETTINGS 〕*
┃ 🔧 ${prefix}setprefix
┃ 🖼️ ${prefix}setpp
┃ 🆘 ${prefix}help
┃ 💬 ${prefix}echo
┃ 🔔 ${prefix}welcome
┃ 🔕 ${prefix}goodbye

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
