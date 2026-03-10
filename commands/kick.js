module.exports = async (sock, m, { args, isBotAdmin, isAdmin, isOwner }) => {
    const groupMetadata = m.isGroup ? await sock.groupMetadata(m.key.remoteJid) : "";
    const participants = m.isGroup ? groupMetadata.participants : [];

    // 1. Tcheke si se nan gwoup kòmand lan fèt
    if (!m.isGroup) return sock.sendMessage(m.key.remoteJid, { text: "Kòmand sa fèt pou gwoup sèlman!" }, { quoted: m });

    // 2. Tcheke si moun k ap fè kòmand lan se Admin oswa Owner
    if (!isAdmin && !isOwner) return sock.sendMessage(m.key.remoteJid, { text: "Ou pa admin, ou pa ka fè sa!" }, { quoted: m });

    // 3. Tcheke si bot la menm se Admin
    if (!isBotAdmin) return sock.sendMessage(m.key.remoteJid, { text: "Mwen bezwen Admin nan gwoup la pou m ka mete moun deyò!" }, { quoted: m });

    // 4. Jwenn moun w ap mete deyò a (si w tag li oswa si w reponn mesaj li)
    let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;

    if (!users) return sock.sendMessage(m.key.remoteJid, { text: "Tag moun w ap mete deyò a oswa reponn mesaj li ak .kick" }, { quoted: m });

    try {
        // 5. Egzekite kick la
        await sock.groupParticipantsUpdate(m.key.remoteJid, [users], "remove");
        
        await sock.sendMessage(m.key.remoteJid, { 
            text: `✅ Moun sa retire ak siksè pa @${m.sender.split("@")[0]}`,
            mentions: [m.sender]
        }, { quoted: m });

    } catch (e) {
        console.log(e);
        await sock.sendMessage(m.key.remoteJid, { text: "Mwen pa ka mete moun sa deyò (li ka se mèt gwoup la oswa gen yon erè)." }, { quoted: m });
    }
}
