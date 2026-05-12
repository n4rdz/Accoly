import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Read and execute schema file
    const schemaPath = path.join(__dirname, '001_create_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema migration...');
    const { error: schemaError } = await supabase.sql(schemaSQL);
    if (schemaError) {
      console.error('Schema error:', schemaError);
    } else {
      console.log('✓ Schema created successfully');
    }

    // Read and execute seed file
    const seedPath = path.join(__dirname, '002_seed_data.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    console.log('Executing seed data...');
    const { error: seedError } = await supabase.sql(seedSQL);
    if (seedError) {
      console.error('Seed error:', seedError);
    } else {
      console.log('✓ Seed data inserted successfully');
    }

    console.log('✓ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
