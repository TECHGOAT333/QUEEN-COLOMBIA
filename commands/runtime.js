module.exports = async (sock, m) => {

const uptime = process.uptime()

await sock.sendMessage(
m.key.remoteJid,
{ text: "⏱ Runtime: " + uptime + " seconds" },
{ quoted: m }
)

}
