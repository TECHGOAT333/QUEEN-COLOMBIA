const fs = require("fs")
const path = require("path")
const settings = require("../settings.js") 

module.exports = async (sock, m, args) => {
    const chatJid = m.key.remoteJid;
    
    // 1. SECURITY: Only the Owner can change the prefix
    // Replace '50934410653' with your actual WhatsApp number
    const ownerNumber = "50934410653@s.whatsapp.net"; 
    const isOwner = m.sender === ownerNumber;

    if (!isOwner) {
        return await sock.sendMessage(chatJid, { 
            text: "❌ *Access Denied:* Only the *Owner* can change the bot prefix!" 
        }, { quoted: m });
    }

    // 2. Check if a new prefix was provided
    if (!args[0]) {
        return await sock.sendMessage(chatJid, { 
            text: "❓ *Error:* Please provide a new prefix (e.g., .setprefix !)" 
        }, { quoted: m });
    }

    const newPrefix = args[0];
    const filePath = path.join(__dirname, "../settings.js")

    try {
        // 3. Modify the settings file on disk (Persistent update)
        let text = fs.readFileSync(filePath, "utf8")
        text = text.replace(/prefix: ".*?"/, `prefix: "${newPrefix}"`)
        fs.writeFileSync(filePath, text)

        // 4. Update the prefix in the bot's memory immediately
        settings.prefix = newPrefix;
        if (global) global.prefix = newPrefix;

        // 5. Send success message
        const successMsg = `
*╭───〔 ⚙️ PREFIX UPDATED 〕───⭐*
│
│ ✅ *Status:* Success!
│ 🆕 *New Prefix:* ${newPrefix}
│ 🤖 *Example:* Try typing *${newPrefix}menu*
│
*╰──────────────⭐*
        `.trim();

        await sock.sendMessage(chatJid, { text: successMsg }, { quoted: m });

    } catch (e) {
        console.error("Prefix Change Error:", e)
        await sock.sendMessage(chatJid, { 
            text: "❌ *Error:* Failed to update the prefix. Check your file permissions." 
        }, { quoted: m });
    }
}
