module.exports = async (sock, m) => {

await sock.sendMessage(
m.key.remoteJid,
{ text: "Promote command" },
{ quoted: m }
)

}
