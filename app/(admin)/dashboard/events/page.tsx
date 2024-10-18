import { Metadata } from "next";

import { fetchEvents } from "@/app/lib/data";
import { CreateEntity } from "@/app/ui/entity-buttons";
import Search from "@/app/ui/search";
import { lusitana } from "@/app/ui/fonts";
import { EVENT_ADMIN_PAGE_CONTEXT } from "@/app/lib/page-context-data";
import EventViewAdmin from "@/app/ui/events/event_view_admin";

const PAGE_CONTEXT = EVENT_ADMIN_PAGE_CONTEXT;
const FETCH_DATA = fetchEvents;

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
        <Search placeholder="Search events..." />
        <CreateEntity
          createLink={`${PAGE_CONTEXT.BASE_URL}/create`}
          entity={PAGE_CONTEXT.ENTITY}
        />
      </div>
      {!!data ? <EventViewAdmin data={data} /> : ""}
    </main>
  );
}
