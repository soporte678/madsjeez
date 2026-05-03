import { getAdminSupabase } from "../src/lib/supabase-admin";

async function main() {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("sku")
    .ilike("sku", "MADSJEEZ-%")
    .order("sku", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Last SKU:", data);

  // Get seller ID for vianferreteria@gmail.com
  const { data: seller } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", "vianferreteria@gmail.com")
    .single();

  console.log("Seller:", seller);

  // Count products for this seller
  if (seller) {
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("sellerId", seller.id);
    console.log("Products count:", count);
  }
}

main();
