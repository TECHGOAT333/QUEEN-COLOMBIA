module.exports = async (sock, m) => {

await sock.sendMessage(
m.key.remoteJid,
{ text: "♻️ Bot ap restart..." },
{ quoted: m }
)

process.exit()

}
