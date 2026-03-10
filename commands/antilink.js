// --- ANTILINK SYSTEM (ENGLISH) ---
if (isGroup && antilink && text.includes("chat.whatsapp.com")) {
    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;
    const admins = participants.filter(p => p.admin !== null).map(p => p.id);
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    
    const isBotAdmin = admins.includes(botId);
    const isSenderAdmin = admins.includes(sender);

    // Check if the link should be removed
    // Note: To test it yourself, remove "&& !isOwner" from the condition
    if (!isSenderAdmin && isBotAdmin && !isOwner) {
        console.log(`🛡️ AntiLink: Link detected from ${sender}`);
        
        // 1. Delete the link message
        await sock.sendMessage(from, { delete: m.key });
        
        // 2. Remove the user from the group
        await sock.groupParticipantsUpdate(from, [sender], "remove");
        
        // 3. Send notification
        await sock.sendMessage(from, { 
            text: `🚫 *AntiLink System*\n\nUser @${sender.split('@')[0]} has been removed for sharing a group link.`,
            contextInfo: { mentionedJid: [sender] }
        });
    } else if (!isBotAdmin) {
        // Warning if the bot is not admin
        await sock.sendMessage(from, { 
            text: "⚠️ *Warning:* A group link was detected, but I cannot take action because I am not an *ADMIN*." 
        });
    }
}
