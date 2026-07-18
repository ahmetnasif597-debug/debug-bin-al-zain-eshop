import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface ParsedRow {
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  price?: string;
  unit?: string;
  category?: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: string[];
}

function normalizeRow(raw: Record<string, unknown>): ParsedRow {
  const get = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const val = raw[k] ?? raw[k.toLowerCase()] ?? raw[k.toUpperCase()];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return String(val).trim();
      }
    }
    return undefined;
  };

  return {
    nameAr: get("nameAr", "name_ar", "الاسم بالعربي", "الاسم", "name"),
    nameEn: get("nameEn", "name_en", "الاسم بالإنجليزي"),
    descriptionAr: get("descriptionAr", "description_ar", "الوصف"),
    price: get("price", "السعر"),
    unit: get("unit", "الوحدة"),
    category: get("category", "الفئة", "categoryName", "category_name"),
  };
}

export async function parseFile(buffer: Buffer, fileName: string): Promise<ParseResult> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const errors: string[] = [];
  let rows: ParsedRow[] = [];

  try {
    if (ext === "csv") {
      const text = buffer.toString("utf-8");
      const result = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });
      if (result.errors.length > 0) {
        result.errors.forEach((e) => errors.push(`خطأ في CSV السطر ${e.row ?? "؟"}: ${e.message}`));
      }
      rows = (result.data as Record<string, unknown>[]).map(normalizeRow);
    } else if (ext === "xlsx" || ext === "xls") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return { rows: [], errors: ["الملف لا يحتوي على أوراق عمل"] };
      }
      const sheet = workbook.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      rows = raw.map(normalizeRow);
    } else {
      return { rows: [], errors: [`نوع الملف غير مدعوم: .${ext} — يُقبل فقط xlsx أو csv`] };
    }

    // Filter completely empty rows
    rows = rows.filter((r) => r.nameAr || r.price || r.category);

    if (rows.length === 0 && errors.length === 0) {
      errors.push("الملف لا يحتوي على بيانات");
    }
  } catch (err) {
    errors.push(`فشل في قراءة الملف: ${err instanceof Error ? err.message : "خطأ غير معروف"}`);
  }

  return { rows, errors };
}
