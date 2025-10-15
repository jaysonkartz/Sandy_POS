#!/usr/bin/env node

/**
 * Simple Supabase connection test
 * Run this after setting up your .env.local file
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please create a .env.local file with:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🔄 Testing products table connection...');
    
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Error connecting to products table:', error.message);
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if your Supabase URL and key are correct');
      console.log('2. Make sure the products table exists in your database');
      console.log('3. Check RLS policies on the products table');
      return;
    }

    console.log('✅ Successfully connected to products table!');
    
    // Get actual product count
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting products:', countError.message);
      return;
    }

    console.log(`📊 Total products in database: ${count}`);
    
    if (count > 0) {
      console.log('🎉 Your database has products! The main page should now show real data.');
    } else {
      console.log('⚠️  No products found in database. You may need to add some products.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testConnection();
