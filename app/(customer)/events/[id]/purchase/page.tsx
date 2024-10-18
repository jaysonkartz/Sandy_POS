import { notFound } from "next/navigation";
import { Metadata } from "next";

import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { eventColumns, fetchEventById } from "@/app/lib/data";
import { Event } from "@/app/lib/definitions";
import { EVENT_CUSTOMER_PAGE_CONTEXT } from "@/app/lib/page-context-data";
import EventPurchase from "@/app/ui/events/event_purchase";

const PAGE_CONTEXT = EVENT_CUSTOMER_PAGE_CONTEXT;
const FETCH_BY_ID = fetchEventById;

type ENTITY_TYPE = Event;
const INPUTS = eventColumns.filter((entry) => entry.editForm === true);

export const metadata: Metadata = {
  title: `Edit ${PAGE_CONTEXT.ENTITY}`,
};

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const CURR_PAGE = `${PAGE_CONTEXT.BASE_URL}/${id}/edit`;
  const entityOfId = await FETCH_BY_ID(id);

  if (!entityOfId) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: PAGE_CONTEXT.ENTITIES, href: PAGE_CONTEXT.BASE_URL },
          {
            label: `Purchase ${PAGE_CONTEXT.ENTITY}`,
            href: CURR_PAGE,
            active: true,
          },
        ]}
      />
      <EventPurchase entityOfId={entityOfId} />
    </main>
  );
}
