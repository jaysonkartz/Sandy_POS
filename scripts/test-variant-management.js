// Test script for Product Variant Management System
// This script demonstrates how to use the variant management functionality

import { createBrowserClient } from "@supabase/ssr";

// Initialize Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Test functions for variant management
export const testVariantManagement = {
  
  // Test creating a variant
  async createVariant(productId: number) {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .insert([{
          product_id: productId,
          variation_name: 'Test Variant',
          variation_name_ch: '测试变体',
          price: 15.99,
          weight: '500g',
          stock_quantity: 50,
          is_default: false
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Variant created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating variant:', error);
      throw error;
    }
  },

  // Test fetching variants for a product
  async getVariants(productId: number) {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('✅ Variants fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching variants:', error);
      throw error;
    }
  },

  // Test updating a variant
  async updateVariant(variantId: number) {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .update({
          price: 18.99,
          stock_quantity: 75,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Variant updated successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating variant:', error);
      throw error;
    }
  },

  // Test deleting a variant
  async deleteVariant(variantId: number) {
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;
      console.log('✅ Variant deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting variant:', error);
      throw error;
    }
  },

  // Test setting default variant
  async setDefaultVariant(productId: number, variantId: number) {
    try {
      // First, unset all default variants for this product
      await supabase
        .from('product_variants')
        .update({ is_default: false })
        .eq('product_id', productId);

      // Then set the new default variant
      const { data, error } = await supabase
        .from('product_variants')
        .update({ is_default: true })
        .eq('id', variantId)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Default variant set successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error setting default variant:', error);
      throw error;
    }
  }
};

// Example usage:
/*
// Get a product ID first
const products = await supabase.from('products').select('id').limit(1);
const productId = products.data?.[0]?.id;

if (productId) {
  // Test the variant management functions
  await testVariantManagement.createVariant(productId);
  const variants = await testVariantManagement.getVariants(productId);
  
  if (variants && variants.length > 0) {
    const variantId = variants[0].id;
    await testVariantManagement.updateVariant(variantId);
    await testVariantManagement.setDefaultVariant(productId, variantId);
    // await testVariantManagement.deleteVariant(variantId); // Uncomment to test deletion
  }
}
*/

export default testVariantManagement;
