module.exports = async (sock, m) => {

const text =
m.message.conversation ||
m.message.extendedTextMessage?.text

if(!text) return

const isLink = /chat.whatsapp.com/i

const from = m.key.remoteJid
const sender = m.key.participant || from

if(isLink.test(text)){
    try{
        if(!m.key.fromMe){ // pa efase pwòp mesaj bot la
            // Efase mesaj la
            await sock.sendMessage(from,{delete: m.key})

            // Kick moun nan si bot admin
            await sock.groupParticipantsUpdate(from,[sender],"remove")

            // Voye mesaj alèt
            await sock.sendMessage(from,{text:"🚫 AntiLink: User removed for sending group link!"})
        }
    }catch(err){
        console.log(err)
    }
}

}
