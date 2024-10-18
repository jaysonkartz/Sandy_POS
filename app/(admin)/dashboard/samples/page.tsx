import { Metadata } from "next";
import { Spacer } from "@nextui-org/react";

import { lusitana } from "@/app/ui/fonts";
import PlanOrderCard from "@/app/ui/samples/plan_order_card";
import PlanOrderCard2 from "@/app/ui/samples/plan_order_card_v2";
import EventOrderCard from "@/app/ui/samples/event_order_card";
import EventOrderCard2 from "@/app/ui/samples/event_order_card_v2";
import QRCodeGenerator from "@/app/ui/samples/event_attendance_qr";

const ENTITIES = "Samples";

export const metadata: Metadata = {
  title: `${ENTITIES}`,
};

export default async function Page() {
  return (
    <main>
      <div className="w-full">
        <div className="flex w-full justify-between">
          <h1 className={`${lusitana.className} text-2xl`}>{ENTITIES}</h1>
        </div>
        <h2 className={`${lusitana.className} text-2xl`}>QR Code Generator</h2>
        <div className="grid grid-flow-row-dense grid-cols-1 gap-2 lg:grid-cols-5">
          <QRCodeGenerator />
        </div>
        <h2 className={`${lusitana.className} text-2xl`}>Layout 1</h2>
        <div className="grid grid-flow-row-dense grid-cols-1 gap-2 lg:grid-cols-5">
          <PlanOrderCard2 />
          <EventOrderCard2 />
          <PlanOrderCard2 />
          <EventOrderCard2 />
          <PlanOrderCard2 />
        </div>
        <Spacer y={4} />
        <h2 className={`${lusitana.className} text-2xl`}>Layout 2</h2>
        <div className="grid grid-flow-row-dense grid-rows-1 gap-2 lg:grid-cols-3">
          <PlanOrderCard />
          <PlanOrderCard />
          <PlanOrderCard />
          <EventOrderCard />
          <EventOrderCard />
          <EventOrderCard />
        </div>
        <Spacer y={4} />
        <h2 className={`${lusitana.className} text-2xl`}>Layout 3</h2>
        <div className="grid grid-flow-row-dense grid-rows-1 gap-2 lg:grid-cols-4">
          <PlanOrderCard />
          <EventOrderCard />
          <PlanOrderCard />
          <EventOrderCard />
          <PlanOrderCard />
          <EventOrderCard />
          <PlanOrderCard />
          <EventOrderCard />
        </div>
      </div>
    </main>
  );
}
