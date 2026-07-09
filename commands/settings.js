import fs from 'fs';
import path from 'path';

// Nou itilize database.json ki nan imaj la pou n sove konfigirasyon yo
const dbPath = path.resolve('./database.json');

function getDatabase() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ users: {} }, null, 2));
    }
    try {
        return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (e) {
        return { users: {} };
    }
}

function saveDatabase(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function isEmoji(text) {
    const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})$/u;
    return emojiRegex.test(text);
}

export async function handleSettingsCommand(msg, client, command, args) {
    const userId = client.user.id.split(':')[0];
    const jid = msg.key.remoteJid;
    const senderId = msg.key.participant ? msg.key.participant.split(':')[0] : jid.split(':')[0];
    const isOwner = msg.key.fromMe || jid.split(':')[0] === senderId;

    let db = getDatabase();
    if (!db.users) db.users = {};
    if (!db.users[userId]) db.users[userId] = {};

    switch (command) {
        case 'setprefix': {
            const prefixArg = args[0] || '';
            db.users[userId].prefix = prefixArg;
            saveDatabase(db);
            await client.sendMessage(jid, { text: `✅ Prefix chanje avèk siksè: "${prefixArg}"` }, { quoted: msg });
            break;
        }

        case 'setreaction': {
            const emojiArg = args[0];
            if (emojiArg && isEmoji(emojiArg)) {
                db.users[userId].reaction = emojiArg;
                saveDatabase(db);
                await client.sendMessage(jid, { text: `✅ Emoji reaksyon chanje: ${emojiArg}` }, { quoted: msg });
            } else {
                await client.sendMessage(jid, { text: `❌ Tanpri mete yon emoji valab. Egzanp: .setreaction ❤️` }, { quoted: msg });
            }
            break;
        }

        case 'setwelcome': {
            const status = args[0]?.toLowerCase();
            if (status === 'on' || status === 'off') {
                db.users[userId].welcome = (status === 'on');
                saveDatabase(db);
                await client.sendMessage(jid, { text: `✅ Mesaj Byenveni (Welcome) mete sou: ${status.toUpperCase()}` }, { quoted: msg });
            } else {
                await client.sendMessage(jid, { text: `❌ Chwazi yon opsyon: .setwelcome on oswa off` }, { quoted: msg });
            }
            break;
        }

        case 'setautorecord': {
            const status = args[0]?.toLowerCase();
            if (status === 'on' || status === 'off') {
                db.users[userId].record = (status === 'on');
                saveDatabase(db);
                await client.sendMessage(jid, { text: `✅ Autorecord mete sou: ${status.toUpperCase()}` }, { quoted: msg });
            } else {
                await client.sendMessage(jid, { text: `❌ Chwazi yon opsyon: .setautorecord on oswa off` }, { quoted: msg });
            }
            break;
        }

        case 'setautotype': {
            const status = args[0]?.toLowerCase();
            if (status === 'on' || status === 'off') {
                db.users[userId].type = (status === 'on');
                saveDatabase(db);
                await client.sendMessage(jid, { text: `✅ Autotype mete sou: ${status.toUpperCase()}` }, { quoted: msg });
            } else {
                await client.sendMessage(jid, { text: `❌ Chwazi yon opsyon: .setautotype on oswa off` }, { quoted: msg });
            }
            break;
        }

        case 'public': {
            if (!isOwner) return await client.sendMessage(jid, { text: `> *⚠️ Sèlman mèt bot la ki ka itilize kòmand sa a!*` }, { quoted: msg });
            const status = args[0]?.toLowerCase();
            if (status === 'on') {
                db.users[userId].publicMode = true;
                saveDatabase(db);
                await client.sendMessage(jid, { text: '✅ Mode public activé' }, { quoted: msg });
            } else if (status === 'off') {
                db.users[userId].publicMode = false;
                saveDatabase(db);
                await client.sendMessage(jid, { text: '🚫 Mode public désactivé' }, { quoted: msg });
            } else {
                await client.sendMessage(jid, { text: '❌ Itilize: .public on oswa off' }, { msg });
            }
            break;
        }
    }
}
