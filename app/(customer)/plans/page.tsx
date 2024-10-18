import { Metadata } from "next";

import { lusitana } from "@/app/ui/fonts";
import { fetchPlansPresentOrFuture } from "@/app/lib/data";
import PlanTableCustomer from "@/app/ui/plans/plans_table_customer";

const ENTITIES = "Plans";

export const metadata: Metadata = {
  title: `${ENTITIES}`,
};

export default async function Page() {
  const plan_data = await fetchPlansPresentOrFuture();

  return (
    <main>
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <h1 className={`${lusitana.className} text-2xl`}>{ENTITIES}</h1>
        </div>
        <div>
          <PlanTableCustomer data={plan_data} />
        </div>
      </div>
    </main>
  );
}
