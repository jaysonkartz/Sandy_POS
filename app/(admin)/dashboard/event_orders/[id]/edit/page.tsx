import { notFound } from "next/navigation";
import { Metadata } from "next";

import EditForm from "@/app/ui/edit-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { fetchEventOrderById, eventOrderColumns } from "@/app/lib/data";
import { EventOrder } from "@/app/lib/definitions";
import { updateEventOrder } from "@/app/lib/actions";
import { EVENT_ORDERS_PAGE_CONTEXT } from "@/app/lib/page-context-data";

const PAGE_CONTEXT = EVENT_ORDERS_PAGE_CONTEXT;
const UPDATE_ACTION = updateEventOrder;
const FETCH_BY_ID = fetchEventOrderById;

type ENTITY_TYPE = EventOrder;
const INPUTS = eventOrderColumns.filter((entry) => entry.editForm === true);

export const metadata: Metadata = {
  title: `Edit ${PAGE_CONTEXT.ENTITY}`,
};

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const entityOfId = await FETCH_BY_ID(id);
  const updateWithId = UPDATE_ACTION.bind(null, id);

  if (!entityOfId) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: PAGE_CONTEXT.ENTITIES, href: PAGE_CONTEXT.BASE_URL },
          {
            label: `Edit ${PAGE_CONTEXT.ENTITY}`,
            href: `${PAGE_CONTEXT.BASE_URL}/${id}/edit`,
            active: true,
          },
        ]}
      />
      <EditForm<ENTITY_TYPE>
        entity={PAGE_CONTEXT.ENTITY}
        entityOfId={entityOfId}
        inputFields={INPUTS}
        prevPage={PAGE_CONTEXT.BASE_URL}
        updateAction={updateWithId}
      />
    </main>
  );
}
