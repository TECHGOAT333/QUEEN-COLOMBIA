const fs = require("fs")
const path = require("path")
// Ou dwe enpòte settings yo isit la si se la prefiks la soti
const settings = require("../settings.js") 

module.exports = async (sock, m, args) => {
    if (!args[0]) return

    const filePath = path.join(__dirname, "../settings.js")

    try {
        // 1. Modifye fichye a sou disk la (pou si l redemare rapid)
        let text = fs.readFileSync(filePath, "utf8")
        text = text.replace(/prefix: ".*?"/, `prefix: "${args[0]}"`)
        fs.writeFileSync(filePath, text)

        // 2. CHANGO ENPÒTAN: Mete ajou prefiks la nan memwa bot la tou
        // Si bot la itilize yon varyab global (eg: global.prefix), mete l isit la:
        global.prefix = args[0] 
        
        // Si se nan settings li ye, nou fòse l chanje
        settings.prefix = args[0]

        await sock.sendMessage(
            m.key.remoteJid,
            { text: "✅ Prefix changed to " + args[0] + "\n\nKounye a ou ka tape " + args[0] + "menu" },
            { quoted: m }
        )
    } catch (e) {
        console.log(e)
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Erè nan chanje prefiks la." })
    }
}
