# Product Variant Management System

## Overview

This document explains how to use the enhanced product variant management system that allows users to modify the product list by adding, editing, and deleting product variants.

## Features

### 1. Product Variants
- **Multiple variants per product**: Each product can have multiple variants with different prices, stock quantities, weights, and images
- **Default variant**: One variant can be marked as the default variant
- **Bilingual support**: Variant names in both English and Chinese
- **Individual pricing**: Each variant can have its own price
- **Stock management**: Track stock quantities per variant
- **Image management**: Each variant can have its own image

### 2. Variant Management Interface
- **Add variants**: Create new product variants with custom details
- **Edit variants**: Modify existing variant information
- **Delete variants**: Remove variants from products
- **Photo editing**: Upload and edit images for each variant
- **Default variant selection**: Mark one variant as the default

## Setup Instructions

### 1. Database Setup

Run the SQL script to create the product_variants table:

```bash
# Execute the SQL script in your Supabase database
psql -h your-db-host -U your-username -d your-database -f scripts/create-product-variants-table.sql
```

Or manually execute the SQL commands in your Supabase SQL editor.

### 2. Component Integration

The variant management system is integrated into the existing product management workflow:

1. **EditProductModal**: Now includes a variant management section
2. **VariantManager**: New component for managing product variants
3. **ProductManagement**: Updated to fetch and display variants

## Usage Guide

### Adding Variants to a Product

1. **Open Product Management**: Navigate to the product management section
2. **Edit Product**: Click the edit button on any product
3. **Access Variant Section**: Scroll down to the "Product Variants" section
4. **Add Variant**: Click "Add Variant" button
5. **Fill Details**:
   - Variant Name (English) - Required
   - Variant Name (Chinese) - Optional
   - Price - Required
   - Stock Quantity - Required
   - Weight - Optional
   - Default Variant - Checkbox to mark as default
6. **Save**: Click "Add Variant" to create the variant

### Editing Variants

1. **Find Variant**: Locate the variant in the variants list
2. **Edit**: Click the edit icon (pencil) next to the variant
3. **Modify**: Update any field in the edit modal
4. **Save**: Click "Save Changes" to update the variant

### Managing Variant Images

1. **Select Variant**: Choose the variant you want to add/edit image for
2. **Photo Editor**: Click the camera icon next to the variant
3. **Upload/Edit**: Use the photo editor to upload or edit images
4. **Save**: The image will be automatically saved to the variant

### Deleting Variants

1. **Select Variant**: Find the variant you want to delete
2. **Delete**: Click the trash icon next to the variant
3. **Confirm**: Confirm the deletion in the popup dialog

## Data Structure

### ProductVariant Interface

```typescript
interface ProductVariant {
  id?: number;
  product_id: number;
  variation_name: string;
  variation_name_ch?: string;
  price: number;
  weight?: string;
  stock_quantity: number;
  image_url?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}
```

### Database Schema

```sql
CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variation_name VARCHAR(255) NOT NULL,
  variation_name_ch VARCHAR(255),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  weight VARCHAR(100),
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Operations

### Create Variant
```typescript
const { data, error } = await supabase
  .from('product_variants')
  .insert([{
    product_id: productId,
    variation_name: 'Small',
    price: 10.99,
    stock_quantity: 100,
    is_default: true
  }])
  .select()
  .single();
```

### Update Variant
```typescript
const { data, error } = await supabase
  .from('product_variants')
  .update({
    price: 12.99,
    stock_quantity: 150
  })
  .eq('id', variantId)
  .select()
  .single();
```

### Delete Variant
```typescript
const { error } = await supabase
  .from('product_variants')
  .delete()
  .eq('id', variantId);
```

### Fetch Variants
```typescript
const { data, error } = await supabase
  .from('product_variants')
  .select('*')
  .eq('product_id', productId)
  .order('created_at', { ascending: true });
```

## Best Practices

### 1. Variant Naming
- Use clear, descriptive names (e.g., "Small", "Medium", "Large")
- Include size, color, or other distinguishing characteristics
- Maintain consistency across similar products

### 2. Pricing Strategy
- Set competitive prices for each variant
- Consider cost differences when pricing variants
- Use the default variant for the most common option

### 3. Stock Management
- Regularly update stock quantities
- Set up low-stock alerts for variants
- Monitor variant performance

### 4. Image Management
- Use high-quality images for variants
- Ensure images accurately represent the variant
- Consider using different angles or details for variants

## Troubleshooting

### Common Issues

1. **Variants not loading**: Check database connection and RLS policies
2. **Cannot add variants**: Verify user permissions and database constraints
3. **Image upload fails**: Check Cloudinary configuration and file size limits
4. **Default variant conflicts**: Ensure only one variant per product is marked as default

### Error Messages

- **"Failed to add variant"**: Check required fields and database constraints
- **"Failed to update variant"**: Verify variant exists and user has permissions
- **"Failed to delete variant"**: Check for foreign key constraints

## Future Enhancements

### Planned Features
1. **Bulk variant operations**: Add/edit multiple variants at once
2. **Variant templates**: Save common variant configurations
3. **Advanced pricing**: Volume discounts, customer-specific pricing
4. **Inventory tracking**: Low stock alerts, reorder points
5. **Analytics**: Variant performance metrics and reporting

### Integration Opportunities
1. **E-commerce platforms**: Sync variants with online stores
2. **Inventory systems**: Connect with external inventory management
3. **Pricing tools**: Integrate with dynamic pricing solutions
4. **Customer preferences**: Track popular variants and trends

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
