module.exports = async (sock, m) => {
await sock.sendMessage(m.key.remoteJid,{text:"✅ Bot la ap mache!"},{quoted:m})
}
