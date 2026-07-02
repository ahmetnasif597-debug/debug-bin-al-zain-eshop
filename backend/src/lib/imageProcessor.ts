import sharp from "sharp";
import { removeBackground } from "@imgly/background-removal-node";

/**
 * يعالج صورة منتج مجاناً بالكامل (محلياً، بدون أي API مدفوع):
 * 1) يزيل الخلفية باستخدام نموذج ذكاء اصطناعي يعمل على السيرفر نفسه.
 * 2) يقص الفراغ الشفاف الزائد حول المنتج.
 * 3) يضع المنتج بمنتصف كادر مربع 1000×1000 بخلفية بيضاء ناصعة (ستايل Getir).
 */
export async function processProductImage(inputBuffer: Buffer): Promise<Buffer> {
  // 1) إزالة الخلفية
  const inputBlob = new Blob([inputBuffer]);
  const noBgBlob = await removeBackground(inputBlob);
  const noBgArrayBuffer = await noBgBlob.arrayBuffer();
  const noBgBuffer = Buffer.from(noBgArrayBuffer);

  // 2) قص الفراغ الشفاف الزائد حول المنتج
  const trimmedBuffer = await sharp(noBgBuffer).trim().toBuffer();

  // 3) تصغير المنتج ليدخل ضمن مربع 850×850 (يترك هامش ~75px من كل جهة)
  const resizedBuffer = await sharp(trimmedBuffer)
    .resize({
      width: 850,
      height: 850,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer();

  const resizedMeta = await sharp(resizedBuffer).metadata();
  const productWidth = resizedMeta.width ?? 850;
  const productHeight = resizedMeta.height ?? 850;

  const left = Math.round((1000 - productWidth) / 2);
  const top = Math.round((1000 - productHeight) / 2);

  // 4) إنشاء كادر أبيض 1000×1000 ووضع المنتج بمنتصفه
  const finalBuffer = await sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: resizedBuffer, left, top }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return finalBuffer;
}
