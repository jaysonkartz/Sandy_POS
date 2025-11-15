# How to Add Product Variations

## Quick Guide

Your POS system already has a built-in variant management system! Here's how to use it:

### Step-by-Step Instructions

#### Step 1: Navigate to Product List
1. Go to **Management Portal**
2. Click on **"Product List"** tab (or "Pricing" section)

#### Step 2: Expand a Product
1. Find the product you want to add variations to (e.g., "Byadgi Dried Chilli")
2. Click the **arrow (▶)** next to the product name to expand it
3. You'll see additional details about the product

#### Step 3: Open Variant Management
1. In the expanded section, you'll see a **"Manage Variants"** button
2. Click the **"Manage Variants"** button
3. The variant management interface will appear

#### Step 4: Choose Your Variant System
You have two options (shown as a checkbox):
- **Unchecked (Default)**: Uses VariantExtractor - works with your existing product table structure
- **Checked**: Uses VariantManager - uses a dedicated `product_variants` table

**Recommendation**: Start with the **checked option** (New Variant System) for better organization.

#### Step 5: Add a New Variation
1. Click the **"Add Variant"** button (blue button with a plus icon)
2. Fill in the variant details:
   - **Variant Name (English)** *Required* - e.g., "Small", "2 inches", "50g"
   - **Variant Name (Chinese)** *Optional* - e.g., "小", "2寸", "50克"
   - **Price** *Required* - Enter the price for this variant
   - **Stock Quantity** *Required* - Enter how many units you have
   - **Weight** *Optional* - e.g., "50g", "100g", "500g"
   - **Set as default variant** - Check this if this should be the default option
3. Click **"Add Variant"** to save

#### Step 6: Manage Your Variations
- **Edit**: Click the pencil icon (✏️) to edit a variant
- **Delete**: Click the trash icon (🗑️) to remove a variant
- **Add Photo**: Click the camera icon (📷) to upload/edit variant image
- **Set Default**: Check "Set as default variant" to mark one as default

### Example: Adding Variations to "Byadgi Dried Chilli"

Instead of having multiple entries like:
- Byadgi Dried Chilli - $5.27
- Byadgi Dried Chilli - $10.80
- Byadgi Dried Chilli - $1.00

You can organize them as one product with variations:
1. **Byadgi Dried Chilli**
   - Variation 1: "Small" (2") - $5.27
   - Variation 2: "Medium" (4") - $10.80
   - Variation 3: "Large" (6") - $1.00

### Visual Flow

```
Management Portal
  └─> Product List Tab
      └─> [Click ▶ next to product name]
          └─> [Click "Manage Variants" button]
              └─> [Choose variant system: ✓ Use New Variant System]
                  └─> [Click "Add Variant"]
                      └─> [Fill in details]
                          └─> [Click "Add Variant" to save]
```

### Benefits of Using Variations

✅ **Organized**: All variations under one product  
✅ **Clear Pricing**: Each variation has its own price  
✅ **Stock Tracking**: Track inventory per variation  
✅ **Better UX**: Customers see all options together  
✅ **Easier Management**: Edit one product instead of multiple entries  

### Troubleshooting

**Q: I don't see "Manage Variants" button?**  
A: Make sure you've clicked the arrow (▶) to expand the product details first.

**Q: "Manage Variants" button doesn't work?**  
A: Make sure the database table `product_variants` exists. Run the SQL script: `scripts/create-product-variants-table.sql`

**Q: Variants aren't showing?**  
A: Check that you're using the "New Variant System" (checkbox checked) and that variants were successfully added.

**Q: Can I convert existing duplicate products to variations?**  
A: Yes! You can manually add variations for each duplicate product, then delete the duplicate entries.

### Database Setup (If Not Done Yet)

If you haven't set up the `product_variants` table yet:

1. Open your Supabase SQL Editor
2. Run the script: `scripts/create-product-variants-table.sql`
3. This creates the necessary table and permissions

---

**Need Help?** Check the `PRODUCT_VARIANTS_GUIDE.md` for more detailed information about the variant system.

