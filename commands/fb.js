// Fonksyon itil
function isUrl(u) {
  return typeof u === "string" && /^https?:\/\/\S+/i.test(u.trim());
}

function cleanUrl(u) {
  if (!isUrl(u)) return null;
  return u.trim().replace(/\s+/g, "");
}

async function getJson(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json, text/plain, */*',
      'user-agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    }
  });
  const data = await response.json();
  return { status: response.status, data: data };
}

async function fetchThumbAsBuffer(url) {
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Safari/537.36' }
    });
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (e) {
    console.log("Erè thumbnail:", e);
  }
  return undefined;
}

// --- PRENSIPAL KÒMAND ---
module.exports = async (sock, m, args) => {
  const chatId = m.key.remoteJid;
  const url = args[0];

  if (!url) {
    return await sock.sendMessage(chatId, {
      text: "👑 *QUEEN COLAMBIA*\n\n❌ Tanpri mete yon lyen Facebook valid.\n*Egzanp:* .fb https://www.facebook.com/share/r/xxxx",
    }, { quoted: m });
  }

  const lower = url.toLowerCase();
  if (!lower.includes("facebook.com") && !lower.includes("fb.watch")) {
    return await sock.sendMessage(chatId, { text: "❌ Sa a se pa yon lyen Facebook valid." }, { quoted: m });
  }

  // Reyaksyon "M ap travay" ✨
  await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

  try {
    const apiUrl = `https://tele-social.vercel.app/down?url=${encodeURIComponent(url)}`;
    const res = await getJson(apiUrl);

    if (res.status < 200 || res.status >= 300) {
      await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
      return await sock.sendMessage(chatId, { text: "❌ Erè nan API a. Eseye ankò pita." }, { quoted: m });
    }

    const root = res.data;

    if (!root || root.status !== true || !root.data) {
      await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
      return await sock.sendMessage(chatId, { text: "❌ Mwen pa ka jwenn videyo sa a. Li ka prive." }, { quoted: m });
    }

    const media = root.data.media || {};
    const videoUrl = cleanUrl(media.download) || cleanUrl(media.video);
    const thumb = cleanUrl(root.data.thumbnail);

    if (!videoUrl) {
      await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
      return await sock.sendMessage(chatId, { text: "❌ Lyen telechajman an pa jwenn." }, { quoted: m });
    }

    const caption = 
      `╭━━━〔 📥 FACEBOOK 〕━━━╮\n` +
      `┃ ✅ Done ak siksè!\n` +
      `┃ 👑 Bot: QUEEN COLAMBIA\n` +
      `╰━━━━━━━━━━━━━━━━━━━━╯`;

    let thumbBuffer = thumb ? await fetchThumbAsBuffer(thumb) : undefined;
    
    await sock.sendMessage(chatId, {
      video: { url: videoUrl },
      mimetype: "video/mp4",
      caption: caption,
      jpegThumbnail: thumbBuffer
    }, { quoted: m });

    await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

  } catch (e) {
    console.error("facebook error:", e);
    await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
    await sock.sendMessage(chatId, { text: "❌ Yon erè rive. Eseye ankò pita." }, { quoted: m });
  }
};

