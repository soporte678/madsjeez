const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://doweovsukuskflgnxhhn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvd2VvdnN1a3Vza2ZsZ254aGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTkyNzEsImV4cCI6MjA5Mjc5NTI3MX0.a0H7VrFwHWZavy8L0DjUyoAecQAdEf22UsA-a0p0u4Y"
);

async function main() {
  // First get a product ID
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, title")
    .limit(1);
  
  if (pErr) { console.log("Product fetch error:", pErr.message); return; }
  console.log("Test product:", products[0].id, products[0].title);
  
  // Try inserting a test image row
  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: products[0].id,
      url: "https://test-placeholder.com/test.jpg",
      order: 999,
    })
    .select();
  
  if (error) {
    console.log("Insert error:", error.message);
  } else {
    console.log("Insert success:", data[0].id);
    // Clean up test row
    const { error: delErr } = await supabase
      .from("product_images")
      .delete()
      .eq("id", data[0].id);
    console.log("Cleanup:", delErr ? delErr.message : "OK");
  }
}

main();
