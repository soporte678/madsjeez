import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const BASE_DIR = "C:/Users/Mi Pc/Desktop/MERCADOLIBRE CUENTA NUEVA";

async function main() {
  // Get first 3 folders only
  const folders = fs.readdirSync(BASE_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => ({ name: d.name, path: path.join(BASE_DIR, d.name) }))
    .filter(f => fs.readdirSync(f.path).some(file => /\.(jpg|jpeg|png|webp)$/i.test(file)))
    .slice(0, 3);

  console.log(`Testing with ${folders.length} folders:`, folders.map(f => f.name));

  for (const folder of folders) {
    const title = folder.name.trim();
    console.log(`\nTesting: ${title}`);

    // Test Gemini
    try {
      const result = await model.generateContent(
        `Escribí una descripción breve en español argentino para un marketplace de ferretería. Producto: "${title}". 100 palabras máximo.`
      );
      console.log("  Gemini OK, length:", result.response.text().length);
    } catch (e: any) {
      console.error("  Gemini ERROR:", e.message);
    }

    // Test image count
    const files = fs.readdirSync(folder.path).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    console.log("  Images found:", files.length, files.slice(0, 2));
  }

  console.log("\nTest complete.");
}

main().catch(console.error);
