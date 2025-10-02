#!/usr/bin/env node

/**
 * Test script to verify sign-in records connection and data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing sign-in records connection...\n');

  try {
    // Test 1: Check if table exists
    console.log('1. Checking if sign_in_records table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('sign_in_records')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('❌ Table does not exist or is not accessible:', tableError.message);
      console.log('\n💡 Solution: Run the SQL schema in Supabase dashboard:');
      console.log('   Go to Supabase → SQL Editor → Run the contents of app/lib/signin-schema.sql');
      return;
    }
    console.log('✅ Table exists and is accessible');

    // Test 2: Check record count
    console.log('\n2. Checking record count...');
    const { count, error: countError } = await supabase
      .from('sign_in_records')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting records:', countError.message);
      return;
    }

    console.log(`📊 Total records in sign_in_records: ${count}`);

    if (count === 0) {
      console.log('\n💡 No records found. This is why the UI shows "No records found"');
      console.log('   Solutions:');
      console.log('   1. Run the test data script: scripts/create-test-signin-data.sql');
      console.log('   2. Try logging in to generate real records');
      console.log('   3. Check if sign-in logging is working in your login components');
    } else {
      console.log('✅ Records found! The issue might be with RLS policies or UI components');
    }

    // Test 3: Try to fetch some records
    console.log('\n3. Testing record fetch...');
    const { data: records, error: fetchError } = await supabase
      .from('sign_in_records')
      .select('*')
      .limit(5)
      .order('sign_in_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching records:', fetchError.message);
      console.log('\n💡 This might be an RLS (Row Level Security) issue');
      console.log('   Solution: Run scripts/fix-signin-rls.sql in Supabase SQL Editor');
      return;
    }

    console.log(`✅ Successfully fetched ${records.length} records`);
    if (records.length > 0) {
      console.log('📋 Sample record:');
      console.log(JSON.stringify(records[0], null, 2));
    }

    // Test 4: Check RLS policies
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .rpc('get_table_policies', { table_name: 'sign_in_records' })
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    if (policyError) {
      console.log('⚠️  Could not check RLS policies (this is normal)');
    } else {
      console.log('✅ RLS policies checked');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testConnection();
