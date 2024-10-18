import { Metadata } from "next";

import { fetchPlans } from "@/app/lib/data";
import { CreateEntity } from "@/app/ui/entity-buttons";
import Search from "@/app/ui/search";
import { lusitana } from "@/app/ui/fonts";
import { PLAN_ADMIN_PAGE_CONTEXT } from "@/app/lib/page-context-data";
import PlanViewAdmin from "@/app/ui/plans/plan_view_admin";

const PAGE_CONTEXT = PLAN_ADMIN_PAGE_CONTEXT;
const FETCH_DATA = fetchPlans;

export const metadata: Metadata = {
  title: `${PAGE_CONTEXT.ENTITIES}`,
};

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;

  const data = await FETCH_DATA();

  return (
    <main>
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>
          {PAGE_CONTEXT.ENTITIES}
        </h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search plans..." />
        <CreateEntity
          createLink={`${PAGE_CONTEXT.BASE_URL}/create`}
          entity={PAGE_CONTEXT.ENTITY}
        />
      </div>
      {!!data ? <PlanViewAdmin data={data} /> : ""}
    </main>
  );
}
