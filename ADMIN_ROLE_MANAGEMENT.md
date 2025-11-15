# Admin Role Management Guide

## Overview

This guide explains how to allow **all authenticated users (including customers)** to change user roles (promote users to admin or demote admins to customer). The user management table also displays customer names.

## Implementation Summary

### 1. Updated EditUserModal Component

The `EditUserModal` component has been improved to:
- Use correct role constants (`CUSTOMER` and `ADMIN` instead of `USER`)
- Sync role value when the user prop changes
- Validate role values before updating
- Provide better user feedback with success/error messages
- Include role selection dropdown with proper options

**Location:** `components/EditUserModal.tsx`

### 2. Updated User Management Dashboard

The user management table now:
- **Displays customer names** from the customers table (falls back to email prefix if no name found)
- Shows Name, Email, Role, Created At columns
- Fetches customer data and merges it with user data
- Allows all authenticated users to view and edit user roles

**Location:** `app/management/dashboard/page.tsx`

### 3. Database RLS Policies

Created SQL script to set up Row Level Security (RLS) policies for the `users` table that:
- Allow users to view their own profile
- **Allow all authenticated users to view all users** (for user management)
- **Allow all authenticated users (including customers) to update user roles**

**Location:** `scripts/setup-users-rls-policies.sql`

## Setup Instructions

### Step 1: Run the SQL Script

1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Open the file `scripts/setup-users-rls-policies.sql`
4. Copy and paste the SQL commands into the SQL Editor
5. Run the script

This will:
- Enable RLS on the `users` table (if not already enabled)
- Create policies allowing **all authenticated users** to view and update user roles
- Verify the policies were created correctly

### Step 2: Verify the Setup

After running the SQL script, you can verify it worked by:

1. Checking that you can view users in the management dashboard
2. Clicking "Edit" on any user
3. Changing their role from Customer to Admin (or vice versa)
4. Confirming the role update succeeds

## How to Use

### Changing a User to Admin (Available to All Users)

Any authenticated user (including customers) can change user roles:

1. Navigate to the Management Dashboard (`/management/dashboard`)
2. Click on the "Users" section in the navigation
3. You'll see a table showing:
   - **Name** (from customers table or email prefix)
   - **Email**
   - **Role** (ADMIN or CUSTOMER)
   - **Created At**
   - **Actions**
4. Find the user you want to promote to admin
5. Click the "Edit" button next to their name
6. In the modal:
   - Select "Admin" from the Role dropdown
   - Click "Update Role"
7. The user's role will be updated and the table will refresh

### Changing an Admin to Customer

Follow the same steps as above, but select "Customer" instead of "Admin" in the role dropdown.

## Security Notes

- **All authenticated users (including customers) can change user roles**
- The database enforces access through Row Level Security (RLS) policies
- All authenticated users can view and update user roles
- All role updates are logged in the database

## Troubleshooting

### Issue: "new row violates row-level security policy"

**Solution:** Make sure you've run the SQL script (`setup-users-rls-policies.sql`) in your Supabase SQL Editor.

### Issue: Role dropdown shows "USER" instead of "CUSTOMER"

**Solution:** The component has been updated to use `CUSTOMER`. If you still see "USER", clear your browser cache and refresh.

### Issue: Can't see the Users section

**Solution:** 
- Make sure you're logged in as an authenticated user
- Navigate to `/management/dashboard`
- Check that the "Users" section is visible in the navigation menu

### Issue: Edit button doesn't open modal

**Solution:**
- Check browser console for JavaScript errors
- Verify that `EditUserModal` component is properly imported
- Check that the modal state management is working correctly

## Role Values

The system uses the following role values:
- `ADMIN` - Administrator with full access
- `CUSTOMER` - Regular customer user

These are defined in `app/constants/app-constants.ts` as `USER_ROLES`.

## Files Modified

1. `components/EditUserModal.tsx` - Updated to use correct role constants and improve UX
2. `app/management/dashboard/page.tsx` - Added name column and enhanced user fetching with customer data
3. `scripts/setup-users-rls-policies.sql` - SQL script for RLS policies that allows all authenticated users to change roles

## Testing

To test the functionality:

1. **As Any Authenticated User:**
   - Login as any authenticated user (admin or customer)
   - Navigate to Users section
   - Verify that user names are displayed (from customers table)
   - Edit a user and change their role to Admin
   - Verify the role change appears immediately
   - Edit the same user back to Customer
   - Verify the role change again
   - Check that names are properly displayed in the table

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs for RLS policy violations
3. Verify that your admin user has the correct role in the database
4. Ensure all SQL scripts have been run successfully

