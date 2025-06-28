import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram";
import { NewMessage } from "telegram/events/index.js";
import fs from "fs";
import readline from "readline";

const apiId = 24807405;
const apiHash = "2702110fc79a78d79ab4f58f63db014f";
const sessionFile = "sesi.txt";
const adminIds = [7528868033]; // ID owner (akan dikirimi notifikasi kalau rate limit)

const targetGroups = [
  "@BOOGIEDOWNLPM",
  "@BPEOLPM",
  "@Bebas_Share_IDR6",
  "@CYBERSEXLPM",
  "@DAVIDOLPM",
  "@GIMYUNGLPM",
  "@HOLYSEXLPM",
  "@INUMAKILPM",
  "@JESSICALPM",
  "@JJOVERYNLPM",
  "@JUNGWONLPM",
  "@KALEOLPM",
  "@LAPAKCPROMT",
  "@LAURENTLPM",
  "@LILYLPM",
  "@LPMAGORAHOTEL",
  "@LPMALENNE",
  "@LPMARES",
  "@LPMBEBASBANG",
  "@LPMBEBASFZ",
  "@LPMBILLIE",
  "@LPMBOY",
  "@LPMCATTIE",
  "@LPMCLAIRE",
  "@LPMCOFFEE",
  "@LPMDADDYY",
  "@LPMDEANN",
  "@LPMDICKBAR",
  "@LPMDICKIDS",
  "@LPMDIKTA",
  "@LPMELZE",
  "@LPMENTER",
  "@LPMGEGE",
  "@LPMIDN",
  "@LPMIRENEBAE",
  "@LPMJAKEY",
  "@LPMJAY",
  "@LPMJAZEL",
  "@LPMJENAR",
  "@LPMJESVIE",
  "@LPMJIHYOTWICE",
  "@LPMJIMINPARK",
  "@LPMJUNG",
  "@LPMKAIROV",
  "@LPMKARAMEL",
  "@LPMLADIES",
  "@LPMMASHAA",
  "@LPMMBULLAN",
  "@LPMNIKOO",
  "@LPMNOBITA",
  "@LPMNSFWPM2",
  "@LPMNYENYES",
  "@LPMOFCDRG",
  "@LPMPAPI",
  "@LPMPEARL",
  "@LPMPHARITA",
  "@LPMPOBIE",
  "@LPMRAWR",
  "@LPMRODAGAT",
  "@LPMRPO",
  "@LPMRUKAA",
  "@LPMRUSHEEL",
  "@LPMSHADOW",
  "@LPMSHEA",
  "@LPMSTEVIE",
  "@LPMSUNGHO",
  "@LPMSYES",
  "@LPMTUTU",
  "@LPMURVIL",
  "@LPMVLXIAA",
  "@LPMWINWIN",
  "@LPMWONHE",
  "@LPMWONHEE",
  "@LPMXOXO",
  "@LPMYSTICPROMOTE",
  "@LPMZUHAZANA",
  "@LPMZURA",
  "@LPM_BEBAS_OOT0",
  "@LPM_BHAYNGKARA",
  "@LPM_JAEHYUNN",
  "@LPM_JOHNNY",
  "@LPM_MINJI",
  "@LpmAbai",
  "@LpmBebasOot_Lady",
  "@MEHLPM",
  "@OHAYOLPM",
  "@RYUJINLPM",
  "@SEXTIONLPM",
  "@bebasootspam",
  "@cybersexlpm",
  "@jakelpm",
  "@kenzijul",
  "@lpm_sfs_isi_board",
  "@lpmaiko",
  "@lpmbebasot",
  "@lpmdohwan",
  "@lpmsweetstory",
  "@lpmyenniehelpeu",
  "@lpmzhen",
  "@lppmbebasoot",
  "@sqpromote_roleplayer",
  "@LPMVANT",
  "@LpmAhyeoon",
  "@lpmwoonhak",
  "@LPMGAMBOL",
  "@LPMOMA"
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

// Join ke semua grup dengan anti-flood & delay acak
for (const group of targetGroups) {
  let joined = false;
  while (!joined) {
    try {
      const entity = await client.getEntity(group);
      await client.invoke(new Api.channels.JoinChannel({ channel: entity }));
      console.log(`✅ Joined ${group}`);
      joined = true;
      // Delay random antara 30-60 detik setelah berhasil join
      const randomDelay = 30 + Math.floor(Math.random() * 30);
      await new Promise(res => setTimeout(res, randomDelay * 1000));
    } catch (e) {
      const errMsg = e.message || e.toString();
      if (errMsg.includes("USER_ALREADY_PARTICIPANT")) {
        console.log(`✅ Already joined ${group}`);
        joined = true;
      } else if (errMsg.match(/A wait of (\d+) seconds is required/)) {
        // Tangkap angka detik dari error message
        const waitSeconds = Number(errMsg.match(/A wait of (\d+) seconds is required/)[1]);
        console.warn(`⏳ Flood wait! Join ${group} akan coba lagi dalam ${waitSeconds} detik.`);
        // Notifikasi admin
        for (const adminId of adminIds) {
          await client.sendMessage(adminId, {
            message:
`⏳ *FloodWait Detected!*
Saat join: ${group}
Delay: ${waitSeconds} detik`
          });
        }
        // Tunggu sebelum coba ulang join
        await new Promise(res => setTimeout(res, waitSeconds * 1000));
      } else if (errMsg.includes("CHANNEL_PRIVATE")) {
        console.warn(`🔒 ${group} private/group tidak bisa diakses.`);
        joined = true;
      } else {
        console.warn(`❌ Gagal join ${group}: ${errMsg}`);
        // Coba lanjut join group berikutnya
        joined = true;
      }
    }
  }
}

  client.addEventHandler(async (event) => {
    const msg = event.message;
    if (!msg || !msg.text) return;

    const sender = await msg.getSender();
    const senderId = Number(sender?.id);

// === /bc <pesan> ===
if (msg.message.startsWith("/bc")) {
  if (!adminIds.includes(senderId)) return;

  const text = msg.message.slice(3).trim();
  if (!text) {
    await client.sendMessage(msg.chatId, { message: "⚠️ Format: /bc <pesan>" });
    return;
  }

  for (const group of targetGroups) {
    let sent = false;

    while (!sent) {
      try {
        await client.sendMessage(group, { message: text });
        console.log(`📤 Broadcast terkirim ke ${group}`);
        sent = true;
        await new Promise((res) => setTimeout(res, 30000)); // delay normal 30 detik
      } catch (err) {
        if (err.message.includes("A wait of")) {
          const delay = 240; // delay rate limit
          console.warn(`⏳ Rate limit ${group}, tunggu ${delay}s`);

          // Notifikasi ke admin
          for (const adminId of adminIds) {
            await client.sendMessage(adminId, {
              message:
`⚠️ *Rate Limit Detected!*
Grup: ${group}
Delay: ${delay} detik
Pesan:
${text}`
            });
          }

          await new Promise((res) => setTimeout(res, delay * 1000)); // tunggu sebelum retry
        } else if (err.message.includes("CHAT_WRITE_FORBIDDEN")) {
          console.warn(`🚫 Tidak bisa kirim ke ${group}: write forbidden.`);
          sent = true; // skip karena memang tidak bisa kirim
        } else {
          console.warn(`❌ Gagal kirim ke ${group}: ${err.message}`);
          // akan dicoba ulang
        }
      }
    }
  }

  await client.sendMessage(msg.chatId, { message: "✅ Broadcast selesai dikirim ke semua grup." });
}
// === /listgrup ===
if (msg.message === "/listgrup") {
  if (!adminIds.includes(senderId)) return;

  let listMsg = "📋 *Daftar Grup Target Broadcast:*\n\n";
  let counter = 1;

  for (const group of targetGroups) {
    try {
      const entity = await client.getEntity(group);
      const participant = await client.invoke(
        new Api.channels.GetParticipant({
          channel: entity,
          participant: "me",
        })
      );

      if (participant && participant.participant) {
        listMsg += `${counter++}. ${group} - ✅ Joined\n`;
      } else {
        listMsg += `${counter++}. ${group} - ❌ Not Joined\n`;
      }
    } catch (err) {
      if (err.message.includes("USER_NOT_PARTICIPANT")) {
        listMsg += `${counter++}. ${group} - ❌ Not Joined\n`;
      } else if (err.message.includes("CHANNEL_PRIVATE")) {
        listMsg += `${counter++}. ${group} - 🔒 Private Group\n`;
      } else {
        listMsg += `${counter++}. ${group} - ⚠️ Error: ${err.message}\n`;
      }
    }
  }

  await client.sendMessage(msg.chatId, {
    message: listMsg,
    parseMode: "markdown",
  });
}

  }, new NewMessage({}));

  console.log("📡 Bot siap menerima /bc dan /listgrup dari admin.");
})();