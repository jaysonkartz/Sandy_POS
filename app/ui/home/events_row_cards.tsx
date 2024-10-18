import { Event } from "@/app/lib/definitions";
import MiniEventCard from "@/app/ui/events/event_card_mini";

export default function EventRowCards({ data }: { data: Array<Event> }) {
  return (
    <div className="grid grid-flow-col-dense gap-2 items-stretch overflow-x-auto">
      {data.map((item: Event) => (
        <MiniEventCard key={item.event_id} event={item} />
      ))}
    </div>
  );
}
