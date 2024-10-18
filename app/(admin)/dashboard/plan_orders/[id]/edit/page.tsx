import { notFound } from "next/navigation";
import { Metadata } from "next";

import EditForm from "@/app/ui/edit-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { fetchPlanOrderById, planOrderColumns } from "@/app/lib/data";
import { PlanOrder } from "@/app/lib/definitions";
import { updatePlanOrder } from "@/app/lib/actions";
import { PLAN_ORDERS_PAGE_CONTEXT } from "@/app/lib/page-context-data";

const PAGE_CONTEXT = PLAN_ORDERS_PAGE_CONTEXT;
const UPDATE_ACTION = updatePlanOrder;
const FETCH_BY_ID = fetchPlanOrderById;

type ENTITY_TYPE = PlanOrder;
const INPUTS = planOrderColumns.filter((entry) => entry.editForm === true);

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
