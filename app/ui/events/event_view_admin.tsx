"use client";

import { useState } from "react";
import { Spacer, Switch } from "@nextui-org/react";

import EventTableAdmin from "@/app/ui/events/events_table_admin";
import { Event } from "@/app/lib/definitions";

import EventTableCustomer from "./events_table_customer";

type ENTITY_TYPE = Event;

export default function EventViewAdmin({ data }: { data: Array<ENTITY_TYPE> }) {
  const [isTable, setIsTable] = useState(false);

  return (
    <div>
      <Spacer y={1} />
      <Switch isSelected={isTable} onValueChange={setIsTable}>
        Table View
      </Switch>
      <Spacer y={1} />
      {isTable ? (
        <EventTableAdmin data={data} />
      ) : (
        <EventTableCustomer data={data} />
      )}
    </div>
  );
}
