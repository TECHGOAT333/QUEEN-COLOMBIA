Module.exports = async (sock, m) => {

const uptime = "0h 0m 0s" 
// Mwen korije nimewo a pou l vin 29 paske se sa ki nan lis la
const totalCommands = 29 

const menu = `
┌───⭐
│ ⭐ BOT NAME: QUEEN COLAMBIA
│ ⭐ USER: @${m.sender.split('@')[0]}
│ ⭐ PREFIX: .
│ ⭐ COMMANDS: ${totalCommands}
│ ⭐ UPTIME: ${uptime}
│ ⭐ DEV:  WEEDTECH 
└──────────⭐

*COMMAND LIST:*

┣━〔 🤖 *BOT INFO* 〕
┃ 🚀 .ping
┃ 📡 .alive
┃ 📜 .menu
┃ 👤 .owner
┃ ⏳ .runtime
┃ 📊 .status
┃ 🖥️ .system

┣━〔 🛠 *TOOLS* 〕
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

┣━〔 👮 *GROUP ADMIN* 〕
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

┣━〔 ⚙️ *SETTINGS* 〕
┃ 🔧 .setprefix
┃ 🖼️ .setpp
┃ 🆘 .help
┃ 💬 .echo
┃ 🔔 .welcome
┃ 🔕 .goodbye

      *© 2026 QUEEN COLAMBIA*
`

await sock.sendMessage(m.key.remoteJid, {
    image: { url: "https://files.catbox.moe/3dwe96.jpg" }, 
    caption: menu,
    mentions: [m.sender], 
    contextInfo: {
        externalAdReply: {
            title: "JOIN OUR OFFICIAL CHANNEL",
            body: "Stay updated with Queen Colambia",
            thumbnailUrl: "https://files.catbox.moe/3dwe96.jpg",
            sourceUrl: "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V", 
            mediaType: 1,
            renderLargerThumbnail: true
        }
    }
}, { quoted: m })

}
