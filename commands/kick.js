module.exports = async (sock, m) => {

await sock.sendMessage(
m.key.remoteJid,
{ text: "Kick command (need admin system)" },
{ quoted: m }
)

}
