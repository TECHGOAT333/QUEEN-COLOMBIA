module.exports = async (sock, m) => {
    await sock.sendMessage(
        m.key.remoteJid,
        { text: "Add command" },
        { quoted: m }
    );
};
