module.exports = async (sock, m) => {

await sock.sendMessage(
m.key.remoteJid,
{ text: "🆔 JID: " + m.key.remoteJid },
{ quoted: m }
)

}
