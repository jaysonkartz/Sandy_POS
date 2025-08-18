# Product Photo Editor Setup Guide

This guide will help you set up the product photo editing functionality for your Sandy POS system.

## Features Added

1. **ProductPhotoEditor Component** - A comprehensive photo upload and editing interface
2. **EditProductModal** - Enhanced product editing with photo management
3. **ProductManagement** - Complete product management interface with photo editing
4. **Image Upload API** - Server-side image upload to Cloudinary
5. **Database Integration** - Products table now supports custom image URLs

## Prerequisites

### 1. Cloudinary Account Setup

1. Create a free account at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from your dashboard
3. Create an upload preset (optional but recommended)

### 2. Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Schema Update

You need to add an `image_url` column to your `products` table in Supabase:

```sql
-- Add image_url column to products table
ALTER TABLE products
ADD COLUMN image_url TEXT;

-- Add updated_at column if not exists
ALTER TABLE products
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install cloudinary
# or
pnpm add cloudinary
```

### 2. File Structure

The following files have been created/modified:

```
components/
├── ProductPhotoEditor.tsx     # Photo upload and editing component
├── EditProductModal.tsx       # Enhanced product editing modal
└── ProductManagement.tsx      # Complete product management interface

app/
├── api/
│   └── upload-image/
│       └── route.ts          # Image upload API endpoint
├── management/
│   └── products/
│       └── page.tsx          # Products management page
└── page.tsx                  # Updated to use image_url field
```

### 3. Access the Photo Editor

1. Navigate to `/management/products` in your admin dashboard
2. Click the camera icon on any product to edit its photo
3. Use the "Edit Product" button to access the full product editing interface

## Usage Guide

### Uploading Product Photos

1. **From Product Management Page:**
   - Click the camera icon on any product card
   - Drag and drop an image or click to select
   - Preview and edit the image if needed
   - Click "Save Image" to upload

2. **From Edit Product Modal:**
   - Click "Edit Product" on any product
   - Click "Add Photo" or "Edit Photo" button
   - Follow the same upload process

### Photo Editing Features

- **Drag & Drop Upload** - Simply drag images onto the upload area
- **File Validation** - Supports JPG, PNG, GIF up to 5MB
- **Image Preview** - See your image before uploading
- **Basic Editing** - Crop and adjust images
- **Progress Tracking** - Real-time upload progress
- **Error Handling** - Clear error messages for failed uploads

### Image Management

- **Custom Images** - Products with custom images show a "Custom" badge
- **Fallback System** - Falls back to static images if no custom image is set
- **Image Removal** - Remove custom images to revert to static images
- **Bulk Operations** - Manage multiple products efficiently

## Technical Details

### Image Storage

- Images are uploaded to Cloudinary with automatic optimization
- Images are stored in the `sandy-pos-products` folder
- Automatic resizing to 800x800px with quality optimization
- Secure URLs are stored in the database

### Database Schema

```sql
-- Products table structure
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  Product TEXT NOT NULL,
  Product_CH TEXT,
  Category TEXT,
  "Item Code" TEXT,
  price DECIMAL(10,2),
  UOM TEXT,
  Country TEXT,
  Variation TEXT,
  weight TEXT,
  stock_quantity INTEGER,
  image_url TEXT,           -- NEW: Custom image URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints

- `POST /api/upload-image` - Upload images to Cloudinary
- `POST /api/sign-cloudinary-params` - Sign Cloudinary upload parameters (existing)

## Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check Cloudinary credentials in environment variables
   - Verify upload preset exists and is configured correctly
   - Check file size (max 5MB)

2. **Images Not Displaying**
   - Verify `image_url` column exists in database
   - Check Cloudinary URL accessibility
   - Ensure fallback images exist in `/public/Img/` directory

3. **Permission Errors**
   - Verify Supabase RLS policies allow image_url updates
   - Check user authentication status

### Environment Variable Checklist

```bash
# Required for photo editor functionality
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=✓
CLOUDINARY_API_KEY=✓
CLOUDINARY_API_SECRET=✓
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=✓ (optional)

# Required for database operations
NEXT_PUBLIC_SUPABASE_URL=✓
NEXT_PUBLIC_SUPABASE_ANON_KEY=✓
```

## Security Considerations

1. **File Validation** - Only image files are accepted
2. **Size Limits** - Maximum 5MB per image
3. **Cloudinary Security** - Uses signed uploads with upload presets
4. **Database Security** - RLS policies should be configured appropriately

## Performance Optimization

1. **Image Optimization** - Cloudinary automatically optimizes images
2. **Lazy Loading** - Images load only when needed
3. **Caching** - Cloudinary provides CDN caching
4. **Progressive Loading** - Upload progress indicators

## Future Enhancements

Potential improvements for the photo editor:

1. **Advanced Editing** - Filters, brightness, contrast adjustments
2. **Bulk Upload** - Upload multiple images at once
3. **Image Gallery** - Multiple images per product
4. **AI Enhancement** - Automatic background removal
5. **Image Analytics** - Track image performance

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure database schema is updated
4. Check Cloudinary dashboard for upload status

For additional help, refer to the Cloudinary documentation or contact your development team.
