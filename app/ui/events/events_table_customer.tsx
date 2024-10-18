import { Event } from "@/app/lib/definitions";

import EventCard from "./event_card";

export default function EventTableCustomer({ data }: { data: Array<Event> }) {
  return (
    <div className="grid grid-flow-row-dense grid-cols-1 gap-2 xl:grid-cols-4 items-stretch">
      {data.map((item: Event) => (
        <EventCard key={item.event_id} event={item} />
      ))}
    </div>
  );
}
