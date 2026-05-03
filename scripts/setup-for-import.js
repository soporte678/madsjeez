const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // 1. Create or get vianferreteria@gmail.com seller
  let user = await prisma.user.findUnique({ where: { email: 'vianferreteria@gmail.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'vianferreteria@gmail.com',
        name: 'Vian Ferreteria',
        isSeller: true,
        sellerName: 'Vian Ferreteria',
        role: 'USER',
        subscriptionTier: 'FREE',
      }
    });
    console.log('Created seller:', user.id);
  } else {
    if (!user.isSeller) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isSeller: true, sellerName: 'Vian Ferreteria' }
      });
      console.log('Updated to seller:', user.id);
    } else {
      console.log('Seller exists:', user.id);
    }
  }

  // 2. Create storage bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  const hasBucket = buckets?.some(b => b.name === 'product-images');
  if (!hasBucket) {
    const { data, error } = await supabase.storage.createBucket('product-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
    if (error) {
      console.error('Bucket creation error:', error);
    } else {
      console.log('Created bucket: product-images');
    }
  } else {
    console.log('Bucket already exists: product-images');
  }

  // 3. Get default category
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'General', slug: 'general', description: 'Categoría general' }
    });
    console.log('Created category:', category.id);
  } else {
    console.log('Default category:', category.id, category.name);
  }

  console.log('Setup complete. Seller ID:', user.id, 'Category ID:', category.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
