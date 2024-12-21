import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ProductCategory from './components/ProductCategory';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    return <div>Error loading categories</div>;
  }

  if (!categories || categories.length === 0) {
    return <div>No categories found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Product Categories</h1>
      {categories.map((category) => (
        <ProductCategory
          key={category.id}
          name={category.name}
          categoryId={Number(category.id)}
          products={[]}
        />
      ))}
    </div>
  );
} 