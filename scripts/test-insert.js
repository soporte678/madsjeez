const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, title")
    .limit(1);

  if (pErr) {
    console.log("Product fetch error:", pErr.message);
    return;
  }
  console.log("Test product:", products[0].id, products[0].title);

  const { data, error } = await supabase.from("product_images").insert({
    product_id: products[0].id,
    url: "https://test-placeholder.com/test.jpg",
    order: 999,
  });

  if (error) {
    console.log("Insert error:", error.message);
    return;
  }
  console.log("Inserted:", data);
}

main().catch(console.error);
