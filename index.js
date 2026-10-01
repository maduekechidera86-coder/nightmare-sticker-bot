const { Telegraf, Markup } = require("telegraf");
const sharp = require("sharp");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const TEMP_DIR = path.join(__dirname, "temp");
const DATA_FILE = path.join(__dirname, "packs.json");

fs.mkdirSync(TEMP_DIR, { recursive: true });

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "{}");
}

function loadPacks() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

function savePacks(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getPacks(userId) {
  const data = loadPacks();
  return data[userId] || [];
}

function rememberPack(userId, pack) {
  const data = loadPacks();

  if (!data[userId]) {
    data[userId] = [];
  }

  data[userId].push(pack);
  savePacks(data);
}

const sessions = new Map();

/* ───────── START ───────── */

bot.start(async (ctx) => {
  await ctx.reply(
`𓊈⸸𓊉 𝐍𝐈𝐆𝐇𝐓𝐌𝐀𝐑𝐄 𝐒𝐓𝐈𝐂𝐊𝐄𝐑 𝐋𝐀𝐁

        𓆩☠︎𓆪 𝐄𝐍𝐓𝐄𝐑 𝐓𝐇𝐄 𝐒𝐇𝐀𝐃𝐎𝐖𝐒

🖼️ Send any size of picture.
🕷️ Reply to it with /sticker.

☠️ Create your own pack.
🥀 Forge your own stickers.

𓊈⸸𓊉 𝐍𝐈𝐆𝐇𝐓𝐌𝐀𝐑𝐄 𝐘𝐓`,
    Markup.inlineKeyboard([
      [Markup.button.callback("☠️ MY PACKS", "my_packs")]
    ])
  );
});

/* ───────── STICKER COMMAND ───────── */

bot.command("sticker", async (ctx) => {
  const replied = ctx.message.reply_to_message;

  if (!replied || !replied.photo) {
    return ctx.reply(
`☠️ 𝐍𝐎 𝐈𝐌𝐀𝐆𝐄 𝐅𝐎𝐔𝐍𝐃

Send a picture first.

Then reply to it with:

/sticker`
    );
  }

  sessions.set(ctx.from.id, {
    photo: replied.photo[replied.photo.length - 1],
    step: "choose"
  });

  await ctx.reply(
`𓊈⸸𓊉 𝐍𝐈𝐆𝐇𝐓𝐌𝐀𝐑𝐄 𝐅𝐎𝐔𝐍𝐃

☠️ What are we doing with this image?`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback("🆕 CREATE PACK", "create_pack"),
        Markup.button.callback("➕ ADD TO PACK", "add_pack")
      ],
      [
        Markup.button.callback("❌ CANCEL", "cancel")
      ]
    ])
  );
});

/* ───────── CREATE PACK ───────── */

bot.action("create_pack", async (ctx) => {
  await ctx.answerCbQuery();

  const session = sessions.get(ctx.from.id);

  if (!session) {
    return ctx.reply("🥀 Session expired. Send the image again.");
  }

  session.step = "name";

  await ctx.editMessageText(
`☠️ 𝐍𝐀𝐌𝐄 𝐓𝐇𝐄 𝐏𝐀𝐂𝐊

Enter your sticker pack name.

Example:

𓊈⸸𓊉 NIGHTMARE ARCHIVE`
  );
});

/* ───────── ADD TO PACK ───────── */

bot.action("add_pack", async (ctx) => {
  await ctx.answerCbQuery();

  const session = sessions.get(ctx.from.id);
  const packs = getPacks(ctx.from.id);

  if (!session) {
    return ctx.reply("🥀 Session expired. Send the image again.");
  }

  if (!packs.length) {
    return ctx.editMessageText(
`🥀 𝐍𝐎 𝐏𝐀𝐂𝐊𝐒 𝐅𝐎𝐔𝐍𝐃

Create your first NIGHTMARE pack.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🆕 CREATE PACK", "create_pack")]
      ])
    );
  }

  session.step = "select_pack";

  const buttons = packs.map((pack, index) => [
    Markup.button.callback(
      `🕷️ ${pack.title}`,
      `select_pack:${index}`
    )
  ]);

  buttons.push([
    Markup.button.callback("❌ CANCEL", "cancel")
  ]);

  await ctx.editMessageText(
`𓊈⸸𓊉 𝐘𝐎𝐔𝐑 𝐏𝐀𝐂𝐊𝐒

Choose where the new sticker should go:`,
    Markup.inlineKeyboard(buttons)
  );
});

/* ───────── SELECT PACK ───────── */

bot.action(/^select_pack:(\d+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const session = sessions.get(ctx.from.id);
  const packs = getPacks(ctx.from.id);
  const index = Number(ctx.match[1]);

  if (!session || !packs[index]) {
    return ctx.reply("🥀 Session expired.");
  }

  session.pack = packs[index];
  session.step = "emoji";

  await ctx.editMessageText(
`𓆩☠︎𓆪 𝐂𝐇𝐎𝐎𝐒𝐄 𝐘𝐎𝐔𝐑 𝐒𝐈𝐆𝐍

Send 1–3 emojis.

Example:

🥀 🖤 ☠️`
  );
});

/* ───────── CANCEL ───────── */

bot.action("cancel", async (ctx) => {
  await ctx.answerCbQuery();

  sessions.delete(ctx.from.id);

  await ctx.editMessageText(
`🥀 𝐍𝐈𝐆𝐇𝐓𝐌𝐀𝐑𝐄 𝐀𝐁𝐎𝐑𝐓𝐄𝐃

The image has been released from the shadows.`
  );
});

/* ───────── MY PACKS ───────── */

bot.action("my_packs", async (ctx) => {
  await ctx.answerCbQuery();

  const packs = getPacks(ctx.from.id);

  if (!packs.length) {
    return ctx.reply(
`🥀 𝐍𝐎 𝐏𝐀𝐂𝐊𝐒 𝐘𝐄𝐓

Create your first NIGHTMARE pack with /sticker`
    );
  }

  const lines = packs.map((pack, index) =>
    `☠️ ${index + 1}. ${pack.title}\n⚔️ https://t.me/addstickers/${pack.name}`
  );

  await ctx.reply(
`𓊈⸸𓊉 𝐍𝐈𝐆𝐇𝐓𝐌𝐀𝐑𝐄 𝐀𝐑𝐂𝐇𝐈𝐕𝐄

${lines.join("\n\n")}`
  );
});

/* ───────── TEXT INPUT ───────── */

bot.on("text", async (ctx) => {
  const session = sessions.get(ctx.from.id);

  if (!session) return;

  const text = ctx.message.text.trim();

  if (text.startsWith("/")) return;

  if (session.step === "name") {
    if (text.length < 1 || text.length > 64) {
      return ctx.reply(
        "🥀 Pack name must be between 1 and 64 characters."
      );
    }

    session.packName = text;
    session.step = "emoji";

    return ctx.reply(
`𓆩☠︎𓆪 𝐂𝐇𝐎𝐎𝐒𝐄 𝐘𝐎𝐔𝐑 𝐒𝐈𝐆𝐍

「 ${text} 」

Send 1–3 emojis.

Example:

🥀 🖤 ☠️`
    );
  }

  if (session.step === "emoji") {
    const emojis = [...text]
      .filter(char => /\p{Extended_Pictographic}/u.test(char))
      .slice(0, 3);

    if (!emojis.length) {
      return ctx.reply("🥀 Send 1–3 emojis.");
    }

    session.emojis = emojis;

    await createSticker(ctx);
  }
});

/* ───────── TELEGRAM UPLOAD ───────── */

async function uploadStickerFile(userId, filePath) {
  const form = new FormData();

  form.append("user_id", String(userId));

  form.append(
    "sticker",
    fs.createReadStream(filePath),
    {
      filename: "nightmare.webp",
      contentType: "image/webp"
    }
  );

  form.append("sticker_format", "static");

  const url =
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/uploadStickerFile`;

  const response = await axios.post(url, form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 60000,
    validateStatus: () => true
  });

  if (!response.data || !response.data.ok) {
    throw new Error(
      response.data?.description ||
      `Telegram upload failed with HTTP ${response.status}`
    );
  }

  const fileId = response.data.result?.file_id;

  if (!fileId) {
    throw new Error("Telegram did not return a sticker file ID.");
  }

  return fileId;
}

/* ───────── CREATE STICKER ───────── */

async function createSticker(ctx) {
  const session = sessions.get(ctx.from.id);

  if (!session) return;

  let status;
  let outputFile;

  try {
    status = await ctx.reply(
`𓊈⸸𓊉 𝐍𝐈𝐆𝐇𝐓𝐌𝐀𝐑𝐄 𝐄𝐍𝐆𝐈𝐍𝐄

⟡ Capturing image...
⟡ Resizing...
⟡ Compressing...
⟡ Forging sticker...

██████████ 100%

☠️ 𝐄𝐍𝐓𝐄𝐑𝐈𝐍𝐆 𝐓𝐇𝐄 𝐒𝐇𝐀𝐃𝐎𝐖𝐒`
    );

    const id =
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    outputFile = path.join(
      TEMP_DIR,
      `${id}.webp`
    );

    /* DOWNLOAD */

    const fileLink = await ctx.telegram.getFileLink(
      session.photo.file_id
    );

    const imageResponse = await axios.get(
      fileLink.href,
      {
        responseType: "arraybuffer",
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024
      }
    );

    const buffer = Buffer.from(imageResponse.data);

    /* RESIZE + COMPRESS */

    let quality = 82;
    let finalSize = 0;

    for (let attempt = 0; attempt < 7; attempt++) {
      await sharp(buffer)
        .rotate()
        .resize(512, 512, {
          fit: "contain",
          background: {
            r: 0,
            g: 0,
            b: 0,
            alpha: 0
          }
        })
        .webp({
          quality,
          effort: 0
        })
        .toFile(outputFile);

      finalSize = (
        await fs.promises.stat(outputFile)
      ).size;

      if (finalSize <= 512 * 1024) {
        break;
      }

      quality -= 8;
    }

    if (finalSize > 512 * 1024) {
      throw new Error(
        "Could not compress the image below Telegram's sticker size limit."
      );
    }

    /* UPLOAD */

    const fileId = await uploadStickerFile(
      ctx.from.id,
      outputFile
    );

    /* ADD TO EXISTING PACK */

    if (session.pack) {
      await ctx.telegram.callApi(
        "addStickerToSet",
        {
          user_id: ctx.from.id,
          name: session.pack.name,
          sticker: {
            sticker: fileId,
            format: "static",
            emoji_list: session.emojis
          }
        }
      );

      await ctx.telegram.deleteMessage(
        ctx.chat.id,
        status.message_id
      ).catch(() => {});

      await ctx.reply(
`𓊈⸸𓊉 𝐒𝐓𝐈𝐂𝐊𝐄𝐑 𝐀𝐃𝐃𝐄𝐃 𓊉⸸

☠️ PACK
「 ${session.pack.title} 」

𓆩 ${session.emojis.join(" ")} 𓆪

🕷️ The NIGHTMARE grows.

⚔️ OPEN PACK

https://t.me/addstickers/${session.pack.name}`
      );

      await fs.promises.unlink(outputFile).catch(() => {});
      sessions.delete(ctx.from.id);

      return;
    }

    /* CREATE NEW PACK */

    const botInfo = await ctx.telegram.getMe();

    const username = botInfo.username
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();

    const packName =
      `nightmare_${ctx.from.id}_${Date.now()}_by_${username}`;

    await ctx.telegram.callApi(
      "createNewStickerSet",
      {
        user_id: ctx.from.id,
        name: packName,
        title: session.packName,
        stickers: [
          {
            sticker: fileId,
            format: "static",
            emoji_list: session.emojis
          }
        ],
        sticker_type: "regular"
      }
    );

    rememberPack(ctx.from.id, {
      name: packName,
      title: session.packName
    });

    await ctx.telegram.deleteMessage(
      ctx.chat.id,
      status.message_id
    ).catch(() => {});

    await ctx.reply(
`𓊈⸸𓊉 𝐍𝐈𝐆𝐇𝐓𝐌𝐀𝐑𝐄 𝐏𝐀𝐂𝐊 𝐂𝐑𝐄𝐀𝐓𝐄𝐃 𓊉⸸

☠️ PACK
「 ${session.packName} 」

𓆩 ${session.emojis.join(" ")} 𓆪

🖤 Your first sticker has entered the shadows.

⚔️ OPEN PACK

https://t.me/addstickers/${packName}`
    );

    await fs.promises.unlink(outputFile).catch(() => {});
    sessions.delete(ctx.from.id);

  } catch (error) {
    console.error("Sticker error:", error);

    if (status) {
      await ctx.telegram.deleteMessage(
        ctx.chat.id,
        status.message_id
      ).catch(() => {});
    }

    await ctx.reply(
`☠️ 𝐓𝐇𝐄 𝐍𝐈𝐆𝐇𝐓𝐌𝐀𝐑𝐄 𝐑𝐄𝐉𝐄𝐂𝐓𝐄𝐃 𝐈𝐓

${error.message}

🥀 Try again.`
    );

    if (outputFile) {
      await fs.promises.unlink(outputFile).catch(() => {});
    }
  }
}

/* ───────── LAUNCH ───────── */

bot.launch();

console.log(
  "𓊈⸸𓊉 NIGHTMARE STICKER BOT — ONLINE"
);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
