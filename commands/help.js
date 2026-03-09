module.exports = async (sock, m) => {

await sock.sendMessage(
m.key.remoteJid,
{ text: "Use .menu pou wè commands yo" },
{ quoted: m }
)

}
