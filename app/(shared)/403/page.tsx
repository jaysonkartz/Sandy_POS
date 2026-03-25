import { redirect } from "next/navigation";

export default function ForbiddenAliasPage() {
  redirect("/unauthorized");
}
