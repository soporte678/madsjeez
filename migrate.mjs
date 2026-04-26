import { execSync } from 'child_process';

const DATABASE_URL = "postgresql://postgres.svbzmvmmzaqkepeysjyk:Eze12ar432156%24@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

try {
  console.log('Ejecutando migraciones...');
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL },
    stdio: 'inherit',
    cwd: process.cwd()
  });
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
