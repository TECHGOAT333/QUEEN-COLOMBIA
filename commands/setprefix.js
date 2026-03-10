const fs = require("fs")
const path = require("path")
// Import settings to ensure memory updates match the file update
const settings = require("../settings.js") 

module.exports = async (sock, m, args) => {
    // 1. Check if a new prefix was provided
    if (!args[0]) {
        return await sock.sendMessage(m.key.remoteJid, { 
            text: "❓ *Error:* Please provide a new prefix (e.g., .setprefix !)" 
        }, { quoted: m });
    }

    const newPrefix = args[0];
    const filePath = path.join(__dirname, "../settings.js")

    try {
        // 2. Modify the settings file on disk (Persistent update)
        let text = fs.readFileSync(filePath, "utf8")
        text = text.replace(/prefix: ".*?"/, `prefix: "${newPrefix}"`)
        fs.writeFileSync(filePath, text)

        // 3. Update the prefix in the bot's memory immediately
        settings.prefix = newPrefix;
        if (global) global.prefix = newPrefix;

        // 4. Send success message with clear instructions
        const successMsg = `
*╭───〔 ⚙️ PREFIX UPDATED 〕───⭐*
│
│ ✅ *Status:* Success!
│ 🆕 *New Prefix:* ${newPrefix}
│ 🤖 *Example:* Try typing *${newPrefix}menu*
│
*╰──────────────⭐*
        `.trim();

        await sock.sendMessage(m.key.remoteJid, { text: successMsg }, { quoted: m });

    } catch (e) {
        console.error("Prefix Change Error:", e)
        await sock.sendMessage(m.key.remoteJid, { 
            text: "❌ *Error:* Failed to update the prefix. Check your file permissions." 
        });
    }
}
