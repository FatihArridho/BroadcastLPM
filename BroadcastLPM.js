import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram";
import { NewMessage } from "telegram/events/index.js";
import fs from "fs";
import readline from "readline";

// Ganti ini sesuai API key kamu
const apiId = 24807405;
const apiHash = "2702110fc79a78d79ab4f58f63db014f";
const sessionFile = "sesi.txt";

// Admin yang boleh pakai /bc
const adminIds = [7528868033];

// Target grup
const targetGroups = [
  "@kenzijul", "@LPMMASHAA", "@lpm_sfs_isi_board", "@Bebas_Share_IDR6",
  "@BPEOLPM", "@LAPAKCPROMT", "@cybersexlpm", "@LPMKAIROV", "@LPMZUHAZANA",
  "@LPMIRENEBAE", "@LPMBEBASBANG", "@JJOVERYNLPM", "@LPMDICKIDS", "@LPMJAZEL",
  "@LPMURVIL", "@LPMDADDYY", "@LPMARES", "@BOOGIEDOWNLPM", "@LPMIDN",
  "@LPMBEBASFZ", "@LPMZURA", "@JUNGWONLPM", "@LAURENTLPM", "@LPMAGORAHOTEL",
  "@lpmbebasot", "@LPMNOBITA", "@LPMNYENYES", "@LPMNSFWPM2", "@LPMCATTIE"
];

// Load session
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
      const isMember = entity?.megagroup || entity?.broadcast;

      if (!isMember) {
        console.log(`⛔ Bukan grup publik / channel: ${group}`);
        continue;
      }

      try {
        await client.invoke(new Api.channels.JoinChannel({ channel: entity }));
        console.log(`✅ Joined ${group}`);
      } catch (e) {
        if (e.message.includes("USER_ALREADY_PARTICIPANT")) {
          console.log(`✅ Already joined ${group}`);
        } else {
          console.warn(`⚠️ Gagal join ${group}: ${e.message}`);
        }
      }
    } catch (err) {
      console.warn(`❌ Error checking ${group}: ${err.message}`);
    }
  }

  // Handle /bc command
  client.addEventHandler(async (event) => {
    const msg = event.message;
    if (!msg || !msg.text || !msg.message.startsWith("/bc")) return;

    const sender = await msg.getSender();
    if (!adminIds.includes(Number(sender?.id))) return;

    const text = msg.message.slice(3).trim();
    if (!text) {
      await client.sendMessage(msg.chatId, { message: "⚠️ Format: /bc <pesan>" });
      return;
    }

    for (const group of targetGroups) {
      try {
        await client.sendMessage(group, { message: text });
        console.log(`📤 Broadcast terkirim ke ${group}`);
      } catch (err) {
        console.warn(`❌ Gagal kirim ke ${group}: ${err.message}`);
      }
      await new Promise((res) => setTimeout(res, 2000)); // Delay 2 detik
    }

    await client.sendMessage(msg.chatId, { message: "✅ Broadcast selesai dikirim ke semua grup." });
  }, new NewMessage({}));

  console.log("📡 Bot siap menerima /bc dari admin.");
})();