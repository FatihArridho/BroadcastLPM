import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram";
import { NewMessage } from "telegram/events/index.js";
import fs from "fs";
import readline from "readline";

const apiId = 24807405;
const apiHash = "2702110fc79a78d79ab4f58f63db014f";
const sessionFile = "sesi.txt";
const adminIds = [7528868033];

const targetGroups = [
  "@kenzijul", "@LPMMASHAA", "@lpm_sfs_isi_board", "@Bebas_Share_IDR6",
  "@BPEOLPM", "@LAPAKCPROMT", "@cybersexlpm", "@LPMKAIROV", "@LPMZUHAZANA",
  "@LPMIRENEBAE", "@LPMBEBASBANG", "@JJOVERYNLPM", "@LPMDICKIDS", "@LPMJAZEL",
  "@LPMURVIL", "@LPMDADDYY", "@LPMARES", "@BOOGIEDOWNLPM", "@LPMIDN",
  "@LPMBEBASFZ", "@LPMZURA", "@JUNGWONLPM", "@LAURENTLPM", "@LPMAGORAHOTEL",
  "@lpmbebasot", "@LPMNOBITA", "@LPMNYENYES", "@LPMNSFWPM2", "@LPMCATTIE"
];

const stringSession = new StringSession(
  fs.existsSync(sessionFile) ? fs.readFileSync(sessionFile, "utf8") : ""
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log("📲 Starting Telegram client...");
  if (!stringSession.value) {
    await client.start({
      phoneNumber: () => new Promise((resolve) => rl.question("📱 Nomor Telegram: ", resolve)),
      password: () => new Promise((resolve) => rl.question("🔒 Password 2FA (jika ada): ", resolve)),
      phoneCode: () => new Promise((resolve) => rl.question("📩 Kode OTP Telegram: ", resolve)),
      onError: (err) => console.error("❌ Login error:", err),
    });
    fs.writeFileSync(sessionFile, client.session.save());
    rl.close();
    console.log("✅ Session saved.");
  } else {
    await client.connect();
    console.log("🔁 Connected with existing session.");
  }

  const me = await client.getMe();
  console.log(`👤 Logged in as: ${me.username || me.firstName}`);

  // Cek dan join ke semua grup jika belum
  for (const group of targetGroups) {
    try {
      const entity = await client.getEntity(group);
      try {
        await client.invoke(new Api.channels.JoinChannel({ channel: entity }));
        console.log(`✅ Joined ${group}`);
      } catch (e) {
        if (e.message.includes("USER_ALREADY_PARTICIPANT")) {
          console.log(`✅ Already joined ${group}`);
        } else if (e.message.includes("A wait of")) {
          console.warn(`⏳ Rate limit join ${group}: ${e.message}`);
        } else {
          console.warn(`⚠️ Gagal join ${group}: ${e.message}`);
        }
      }
    } catch (err) {
      console.warn(`❌ Error checking ${group}: ${err.message}`);
    }
  }

  client.addEventHandler(async (event) => {
    const msg = event.message;
    if (!msg || !msg.text) return;

    const sender = await msg.getSender();
    const senderId = Number(sender?.id);

    if (msg.message.startsWith("/bc")) {
      if (!adminIds.includes(senderId)) return;

      const text = msg.message.slice(3).trim();
      if (!text) {
        await client.sendMessage(msg.chatId, { message: "⚠️ Format: /bc <pesan>" });
        return;
      }

      for (const group of targetGroups) {
        try {
          await client.sendMessage(group, { message: text });
          console.log(`📤 Broadcast terkirim ke ${group}`);
          await new Promise((res) => setTimeout(res, 2000));
        } catch (err) {
          if (err.message.includes("A wait of")) {
            const delay = parseInt(err.message.match(/\d+/)?.[0] || "30");
            console.warn(`⏳ Rate limit ${group}, tunggu ${delay}s`);
            await new Promise((res) => setTimeout(res, (delay + 1) * 1000));
            try {
              await client.sendMessage(group, { message: text });
              console.log(`✅ Retry berhasil ke ${group}`);
            } catch (retryErr) {
              console.warn(`❌ Gagal retry ${group}: ${retryErr.message}`);
            }
          } else if (err.message.includes("CHAT_WRITE_FORBIDDEN")) {
            console.warn(`🚫 Tidak bisa kirim ke ${group}: write forbidden.`);
          } else {
            console.warn(`❌ Gagal kirim ke ${group}: ${err.message}`);
          }
        }
      }
      await client.sendMessage(msg.chatId, { message: "✅ Broadcast selesai dikirim ke semua grup." });
    }

    if (msg.message === "/listgrup") {
      if (!adminIds.includes(senderId)) return;

      const list = targetGroups.map((g, i) => `${i + 1}. ${g}`).join("\n");
      await client.sendMessage(msg.chatId, {
        message: `📋 *Daftar Grup Target Broadcast:*\n\n${list}`,
        parseMode: "markdown",
      });
    }
  }, new NewMessage({}));

  console.log("📡 Bot siap menerima /bc dan /listgrup dari admin.");
})();