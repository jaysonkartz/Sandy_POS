import { Metadata } from "next";

import { lusitana } from "@/app/ui/fonts";
import { fetchEventsPresentOrFuture } from "@/app/lib/data";
import EventTableCustomer from "@/app/ui/events/events_table_customer";

const ENTITIES = "Events";

export const metadata: Metadata = {
  title: `${ENTITIES}`,
};

export default async function Page() {
  const event_data = await fetchEventsPresentOrFuture();

  return (
    <main>
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <h1 className={`${lusitana.className} text-2xl`}>{ENTITIES}</h1>
        </div>
        <div>
          <EventTableCustomer data={event_data} />
        </div>
      </div>
    </main>
  );
}
