import { Metadata } from "next";

import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import CreateForm from "@/app/ui/create-form";
import { CreatePlanOrder } from "@/app/lib/actions";
import { planOrderColumns } from "@/app/lib/data";
import { PlanOrder } from "@/app/lib/definitions";
import { PLAN_ORDERS_PAGE_CONTEXT } from "@/app/lib/page-context-data";

const PAGE_CONTEXT = PLAN_ORDERS_PAGE_CONTEXT;
const CREATE_ACTION = CreatePlanOrder;

type ENTITY_TYPE = PlanOrder;
const INPUTS = planOrderColumns.filter((entry) => entry.createForm === true);

export const metadata: Metadata = {
  title: `Create ${PAGE_CONTEXT.ENTITY}`,
};

export default async function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: PAGE_CONTEXT.ENTITIES, href: PAGE_CONTEXT.BASE_URL },
          {
            label: `Create ${PAGE_CONTEXT.ENTITY}`,
            href: `${PAGE_CONTEXT.BASE_URL}/create`,
            active: true,
          },
        ]}
      />
      <CreateForm<ENTITY_TYPE>
        createAction={CREATE_ACTION}
        entity={PAGE_CONTEXT.ENTITY}
        inputFields={INPUTS}
        prevPage={PAGE_CONTEXT.BASE_URL}
      />
    </main>
  );
}
