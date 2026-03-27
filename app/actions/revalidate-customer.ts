"use server";

import { revalidatePath } from "next/cache";

/** Invalidate cached RSC payload for the customer home page after catalog mutations. */
export async function revalidateCustomerHome() {
  revalidatePath("/");
}
