const { Telegraf } = require("telegraf");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const TEMP_DIR = path.join(__dirname, "temp");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🕷️ NIGHTMARE STICKER ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

bot.start(async (ctx) => {
  await ctx.reply(
`𓊈⸸𓊉 𝑵𝑰𝑮𝑯𝑻𝑴𝑨𝑹𝑬 𝑺𝑻𝑰𝑪𝑲𝑬𝑹 𝑳𝑨𝑩

🥀 𝑻𝒖𝒓𝒏 𝒚𝒐𝒖𝒓 𝒊𝒎𝒂𝒈𝒆𝒔 𝒊𝒏𝒕𝒐 𝒔𝒕𝒊𝒄𝒌𝒆𝒓𝒔.

🖤 Send an image
↳ Reply to it with /sticker

🕷️ 𝑻𝒉𝒆 𝒅𝒂𝒓𝒌𝒏𝒆𝒔𝒔 𝒅𝒐𝒆𝒔 𝒕𝒉𝒆 𝒓𝒆𝒔𝒕.

𓊈⸸𓊉 𝑵𝑰𝑮𝑯𝑻𝑴𝑨𝑹𝑬 𝒀𝑻`
  );
});

bot.command("sticker", async (ctx) => {
  const replied = ctx.message.reply_to_message;

  if (!replied || !replied.photo) {
    return ctx.reply(
`🥀 𝑵𝑶 𝑰𝑴𝑨𝑮𝑬 𝑭𝑶𝑼𝑵𝑫

Reply to an image with:

/sticker

🕷️ 𝑳𝒆𝒕 𝒕𝒉𝒆 𝒊𝒎𝒂𝒈𝒆 𝒆𝒏𝒕𝒆𝒓 𝒕𝒉𝒆 𝒅𝒂𝒓𝒌.`
    );
  }

  let status;

  try {
    status = await ctx.reply(
`🕷️ 𝑵𝑰𝑮𝑯𝑻𝑴𝑨𝑹𝑬 𝑬𝑵𝑮𝑰𝑵𝑬

⟡ Capturing the image...
⟡ Entering the shadows...
⟡ Forging the sticker...

██████████ 100%

🥀 𝑷𝒓𝒆𝒑𝒂𝒓𝒊𝒏𝒈...`
    );

    const photo = replied.photo[replied.photo.length - 1];

    const fileLink = await ctx.telegram.getFileLink(photo.file_id);

    const id = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    const inputFile = path.join(TEMP_DIR, `${id}.jpg`);
    const outputFile = path.join(TEMP_DIR, `${id}.webp`);

    const response = await fetch(fileLink.href);

    if (!response.ok) {
      throw new Error("Failed to download image");
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    await fs.promises.writeFile(inputFile, buffer);

    await sharp(buffer)
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
        quality: 95
      })
      .toFile(outputFile);

    await ctx.telegram.deleteMessage(
      ctx.chat.id,
      status.message_id
    );

    await ctx.replyWithSticker({
      source: outputFile
    });

    await ctx.reply(
`🖤 𝑺𝑻𝑰𝑪𝑲𝑬𝑹 𝑪𝑹𝑬𝑨𝑻𝑬𝑫

𓊈⸸𓊉 The image has entered the NIGHTMARE.

🥀 Send another image and use /sticker again.`
    );

    await fs.promises.unlink(inputFile).catch(() => {});
    await fs.promises.unlink(outputFile).catch(() => {});

  } catch (error) {
    console.error("Sticker error:", error);

    if (status) {
      await ctx.telegram
        .deleteMessage(ctx.chat.id, status.message_id)
        .catch(() => {});
    }

    await ctx.reply(
`☠️ 𝑻𝑯𝑬 𝑺𝑯𝑨𝑫𝑶𝑾 𝑹𝑬𝑱𝑬𝑪𝑻𝑬𝑫 𝑰𝑻

Something went wrong while forging the sticker.

🥀 Try another image.`
    );
  }
});

bot.catch((error) => {
  console.error("Bot error:", error);
});

bot.launch();

console.log(
  "𓊈⸸𓊉 NIGHTMARE STICKER BOT — ONLINE"
);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
