import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import ProductCategory from "./components/ProductCategory";

export default async function DashboardPage() {
  noStore();

  const supabase = await createSupabaseServerClient();

  const { data: categories, error } = await supabase.from("categories").select("*").order("name");

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
          categoryId={Number(category.id)}
          name={category.name}
          products={[]}
        />
      ))}
    </div>
  );
}
