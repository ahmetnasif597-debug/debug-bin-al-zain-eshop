import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { categoriesTable, productsTable, settingsTable } from "./db/schema";
import { sql } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("🌱  Starting seed...");

  const existing = await db.select({ count: sql<number>`count(*)` }).from(categoriesTable);
  if (Number(existing[0].count) > 0) {
    console.log("⏭️   Data already exists — skipping seed to avoid duplicates.");
    await pool.end();
    return;
  }

  console.log("📦  Inserting categories...");
  const [cat1, cat2, cat3, cat4, cat5] = await db
    .insert(categoriesTable)
    .values([
      { nameAr: "قهوة عربية", nameEn: "Arabian Coffee", slug: "arabian-coffee", icon: "☕", rowNumber: 1 },
      { nameAr: "شاي وأعشاب", nameEn: "Tea & Herbs",    slug: "tea-herbs",      icon: "🍵", rowNumber: 2 },
      { nameAr: "تمور",        nameEn: "Dates",           slug: "dates",          icon: "🌴", rowNumber: 3 },
      { nameAr: "بهارات",      nameEn: "Spices",          slug: "spices",         icon: "🌶️", rowNumber: 4 },
      { nameAr: "حلويات",      nameEn: "Sweets",          slug: "sweets",         icon: "🍯", rowNumber: 5 },
    ])
    .returning();

  console.log("🛍️   Inserting products...");
  await db.insert(productsTable).values([
    {
      nameAr: "قهوة عربية فاخرة",
      nameEn: "Premium Arabian Coffee",
      descriptionAr: "قهوة عربية أصيلة محمصة ومطحونة بعناية، تتميز بنكهتها الغنية وعطرها الفواح",
      price: "15000",
      unit: "كيلو",
      categoryId: cat1.id,
      inStock: true,
      featured: true,
      soldByWeight: true,
      availableWeights: [250, 500, 1000],
    },
    {
      nameAr: "قهوة الهيل",
      nameEn: "Cardamom Coffee",
      descriptionAr: "مزيج مميز من القهوة العربية مع الهيل الأخضر المطحون",
      price: "18000",
      unit: "كيلو",
      categoryId: cat1.id,
      inStock: true,
      featured: true,
      soldByWeight: true,
      availableWeights: [250, 500, 1000],
    },
    {
      nameAr: "شاي أحمر سيلاني",
      nameEn: "Ceylon Black Tea",
      descriptionAr: "شاي أحمر سيلاني فاخر ذو طعم قوي ونكهة غنية",
      price: "8000",
      unit: "كيلو",
      categoryId: cat2.id,
      inStock: true,
      featured: false,
      soldByWeight: true,
      availableWeights: [250, 500, 1000],
    },
    {
      nameAr: "شاي الأعشاب المريمية",
      nameEn: "Sage Herbal Tea",
      descriptionAr: "أعشاب المريمية الطبيعية المجففة، مثالية للاسترخاء",
      price: "6000",
      unit: "كيلو",
      categoryId: cat2.id,
      inStock: true,
      featured: false,
      soldByWeight: false,
    },
    {
      nameAr: "تمر مجهول فاخر",
      nameEn: "Premium Medjool Dates",
      descriptionAr: "تمور مجهول فاخرة كبيرة الحجم، طرية وحلوة بشكل طبيعي",
      price: "35000",
      unit: "كيلو",
      categoryId: cat3.id,
      inStock: true,
      featured: true,
      soldByWeight: true,
      availableWeights: [500, 1000, 2000],
    },
    {
      nameAr: "تمر سكري",
      nameEn: "Sukkari Dates",
      descriptionAr: "تمور سكري ذهبية اللون، مشهورة بحلاوتها الاستثنائية",
      price: "28000",
      unit: "كيلو",
      categoryId: cat3.id,
      inStock: true,
      featured: false,
      soldByWeight: true,
      availableWeights: [500, 1000],
    },
    {
      nameAr: "بهارات الكبسة",
      nameEn: "Kabsa Spice Mix",
      descriptionAr: "خلطة بهارات الكبسة التقليدية المطحونة طازجاً",
      price: "5000",
      unit: "كيلو",
      categoryId: cat4.id,
      inStock: true,
      featured: false,
      soldByWeight: true,
      availableWeights: [250, 500],
    },
    {
      nameAr: "كمون مطحون",
      nameEn: "Ground Cumin",
      descriptionAr: "كمون مطحون طازج عالي الجودة",
      price: "4000",
      unit: "كيلو",
      categoryId: cat4.id,
      inStock: true,
      featured: false,
      soldByWeight: true,
      availableWeights: [250, 500],
    },
    {
      nameAr: "معمول بالتمر",
      nameEn: "Date Ma'amoul",
      descriptionAr: "حلوى المعمول التقليدية المحشوة بالتمر اللذيذ",
      price: "12000",
      unit: "علبة",
      categoryId: cat5.id,
      inStock: true,
      featured: true,
      soldByWeight: false,
    },
    {
      nameAr: "حلاوة طحينية",
      nameEn: "Tahini Halva",
      descriptionAr: "حلاوة طحينية فاخرة بالمكسرات",
      price: "9000",
      unit: "كيلو",
      categoryId: cat5.id,
      inStock: true,
      featured: false,
      soldByWeight: true,
      availableWeights: [250, 500, 1000],
      availableFlavors: ["سادة", "فستق", "شوكولاتة"],
    },
  ]);

  console.log("⚙️   Inserting default settings...");
  await db
    .insert(settingsTable)
    .values([
      { key: "store_name",   value: "بن الزين" },
      { key: "store_status", value: "open" },
      { key: "store_phone",  value: "+963 000 000 000" },
      { key: "store_address", value: "سوريا" },
    ])
    .onConflictDoNothing();

  console.log("✅  Seed completed — 5 categories, 10 products, and default settings inserted.");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  pool.end();
  process.exit(1);
});
