module.exports = async (sock, m) => {

const menu = `
╭━━〔 ⚔️ *QUEEN COLAMBIA* ⚔️ 〕━━╮

   *KONFÈMAN:* Online ✅
   *ITILIZATÈ:* ${m.pushName || 'Chèf'}
   *PWOCHÈN ETAP:* Chwazi yon kòmand

┣━〔 🤖 *BOT INFO* 〕
┃ 🚀 .ping
┃ 📡 .alive
┃ 📜 .menu
┃ 👤 .owner
┃ ⏳ .runtime

┣━〔 🛠 *TOOLS* 〕
┃ ✍️ .say
┃ 🕒 .time
┃ 📅 .date
┃ 🆔 .jid
┃ 🔄 .restart

┣━〔 👮 *GWOUP ADMIN* 〕
┃ 🔨 .kick
┃ ➕ .add
┃ ⬆️ .promote
┃ ⬇️ .demote
┃ 🧹 .delete
┃ 📢 .tagall

┣━〔 ⚙️ *REGLAJ* 〕
┃ 🔧 .setprefix
┃ 🖼️ .setpp
┃ 🆘 .help
┃ 💬 .echo

╰━━━━━━━━━━━━━━━━━━━━╯
      *© 2026 QUEEN COLAMBIA*
`

// Voye imaj la ak nouvo style modern nan
await sock.sendMessage(m.key.remoteJid, {
    image: { url: "https://files.catbox.moe/940jhm.jpg" }, // Lyen foto bot la
    caption: menu
}, { quoted: m })

}
