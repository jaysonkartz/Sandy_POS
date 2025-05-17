import { notFound } from "next/navigation";
import { Metadata } from "next";

import EditForm from "@/app/ui/edit-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { eventColumns, fetchEventById } from "@/app/lib/data";
import { updateEvent } from "@/app/lib/actions";
import { Event } from "@/app/lib/definitions";
import { EVENT_ADMIN_PAGE_CONTEXT } from "@/app/lib/page-context-data";

const PAGE_CONTEXT = EVENT_ADMIN_PAGE_CONTEXT;
const UPDATE_ACTION = updateEvent;
const FETCH_BY_ID = fetchEventById;

type ENTITY_TYPE = Event;
const INPUTS = eventColumns.filter((entry) => entry.editForm === true);

export const metadata: Metadata = {
  title: `Edit ${PAGE_CONTEXT.ENTITY}`,
};

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function Page({ params }: Props) {
  const id = params.id;
  const CURR_PAGE = `${PAGE_CONTEXT.BASE_URL}/${id}/edit`;
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
            href: CURR_PAGE,
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
