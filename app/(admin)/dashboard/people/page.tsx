import { Metadata } from "next";

import { fetchPeople } from "@/app/lib/data";
import Table from "@/app/ui/people/table";
import { CreateEntity } from "@/app/ui/entity-buttons";
import Search from "@/app/ui/search";
import { lusitana } from "@/app/ui/fonts";
import { PEOPLE_PAGE_CONTEXT } from "@/app/lib/page-context-data";

const PAGE_CONTEXT = PEOPLE_PAGE_CONTEXT;
const FETCH_DATA = fetchPeople;

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
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <h1 className={`${lusitana.className} text-2xl`}>
            {PAGE_CONTEXT.ENTITIES}
          </h1>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
          <Search placeholder="Search people..." />
          <CreateEntity
            createLink={`${PAGE_CONTEXT.BASE_URL}/create`}
            entity={PAGE_CONTEXT.ENTITY}
          />
        </div>
        <div>
          <Table data={data} />
        </div>
      </div>
    </main>
  );
}
