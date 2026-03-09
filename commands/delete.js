module.exports = async (sock, m) => {

if(!m.message.extendedTextMessage) return

const key = m.message.extendedTextMessage.contextInfo.stanzaId

await sock.sendMessage(m.key.remoteJid,{ delete:{ remoteJid:m.key.remoteJid, fromMe:true, id:key } })

}
