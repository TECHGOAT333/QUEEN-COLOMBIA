const fs = require("fs")
const path = require("path")

module.exports = async (sock, m, args) => {

if(!args[0]) return

const file = path.join(__dirname,"../settings.js")

let text = fs.readFileSync(file,"utf8")

text = text.replace(/prefix: ".*?"/,`prefix: "${args[0]}"`)

fs.writeFileSync(file,text)

await sock.sendMessage(
m.key.remoteJid,
{ text: "✅ Prefix changed to " + args[0] },
{ quoted: m }
)

}
