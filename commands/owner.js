const settings = require("../settings")

module.exports = async (sock, m) => {

await sock.sendMessage(
m.key.remoteJid,
{ text: "👑 Owner: " + settings.ownerNumber },
{ quoted: m }
)

}
