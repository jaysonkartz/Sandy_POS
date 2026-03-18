import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
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
