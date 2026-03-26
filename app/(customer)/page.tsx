import HomePageClient from "./HomePageClient";
import { fetchPublicProductsForHome } from "@/app/lib/data/public-products";

export const revalidate = 60;

export default async function HomePage() {
  const initial = await fetchPublicProductsForHome();
  return <HomePageClient {...(initial !== null ? { initialProducts: initial } : {})} />;
}
