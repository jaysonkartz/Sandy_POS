import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  noStore();

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userRecord, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || userRecord?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
