case 'gstatut': {
    // Check if the user is the bot owner
    if (!isCreator) return reply("This command is restricted to the bot owner only.")
    
    // Check if there is text after the command
    if (!q) return reply(`Please provide a message to set as status for groups.\n\nExample: .gstatut Hello everyone!`)

    // Fetch all groups the bot is in
    let getGroups = await client.groupFetchAllParticipating()
    let groups = Object.entries(getGroups).slice(0).map(entry => entry[1])
    let anu = groups.map(v => v.id)

    reply(`Sending status update to ${anu.length} groups...`)

    // Loop to send the message to each group
    for (let i of anu) {
        await client.sendMessage(i, { 
            text: q, 
            contextInfo: {
                externalAdReply: {
                    title: "GROUP STATUS UPDATE",
                    body: "Automated Message",
                    thumbnailUrl: "https://telegra.ph/file/votre-image.jpg", 
                    sourceUrl: "https://whatsapp.com/channel/votre-channel",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        })
    }

    reply("Operation completed successfully! ✅")
}
break
