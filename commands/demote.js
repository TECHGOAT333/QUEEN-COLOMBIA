module.exports = async (sock, m) => {

await sock.sendMessage(
m.key.remoteJid,
{ text: "Demote command" },
{ quoted: m }
)

}
