#!/usr/bin/env node

/**
 * Command-line tool to check sign-in records
 * Usage: node scripts/check-signin-records.js [options]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSignInRecords(options = {}) {
  try {
    console.log('🔍 Checking sign-in records...\n');

    // Get command line arguments
    const limit = options.limit || 10;
    const showFailed = options.failed || false;
    const email = options.email || null;

    let query = supabase
      .from('sign_in_records')
      .select('*')
      .order('sign_in_at', { ascending: false });

    if (email) {
      query = query.eq('email', email);
    }

    if (showFailed) {
      query = query.eq('success', false);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching records:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('📭 No sign-in records found');
      return;
    }

    console.log(`📊 Found ${data.length} sign-in record(s):\n`);

    // Display records
    data.forEach((record, index) => {
      const status = record.success ? '✅ Success' : '❌ Failed';
      const date = new Date(record.sign_in_at).toLocaleString();
      const device = record.device_info ? 
        `${record.device_info.browser || 'Unknown'} (${record.device_info.os || 'Unknown'})` : 
        'N/A';

      console.log(`${index + 1}. ${record.email}`);
      console.log(`   Status: ${status}`);
      console.log(`   Date: ${date}`);
      console.log(`   IP: ${record.ip_address || 'N/A'}`);
      console.log(`   Device: ${device}`);
      
      if (record.failure_reason) {
        console.log(`   Reason: ${record.failure_reason}`);
      }
      
      console.log(`   User ID: ${record.user_id.substring(0, 8)}...`);
      console.log('');
    });

    // Show statistics
    const totalRecords = data.length;
    const successfulRecords = data.filter(r => r.success).length;
    const failedRecords = data.filter(r => !r.success).length;
    const uniqueUsers = new Set(data.map(r => r.user_id)).size;

    console.log('📈 Summary:');
    console.log(`   Total records: ${totalRecords}`);
    console.log(`   Successful: ${successfulRecords}`);
    console.log(`   Failed: ${failedRecords}`);
    console.log(`   Unique users: ${uniqueUsers}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach((arg, index) => {
  switch (arg) {
    case '--limit':
    case '-l':
      options.limit = parseInt(args[index + 1]) || 10;
      break;
    case '--failed':
    case '-f':
      options.failed = true;
      break;
    case '--email':
    case '-e':
      options.email = args[index + 1];
      break;
    case '--help':
    case '-h':
      console.log(`
🔐 Sign-in Records Checker

Usage: node scripts/check-signin-records.js [options]

Options:
  -l, --limit <number>    Number of records to show (default: 10)
  -f, --failed           Show only failed sign-in attempts
  -e, --email <email>    Filter by specific email address
  -h, --help             Show this help message

Examples:
  node scripts/check-signin-records.js
  node scripts/check-signin-records.js --limit 20
  node scripts/check-signin-records.js --failed
  node scripts/check-signin-records.js --email user@example.com
      `);
      process.exit(0);
      break;
  }
});

// Run the checker
checkSignInRecords(options);
