module.exports = async (sock, m) => {

const menu = `
╭──〔 QUEEN COLAMBIA BOT 〕
│
│ .ping
│ .alive
│ .menu
│ .owner
│ .say
│ .time
│ .date
│ .jid
│ .tagall
│ .kick
│ .add
│ .promote
│ .demote
│ .delete
│ .runtime
│ .info
│ .echo
│ .restart
│ .help
│ .setprefix
│
╰──────────────
`

await sock.sendMessage(m.key.remoteJid,{text:menu},{quoted:m})

}
