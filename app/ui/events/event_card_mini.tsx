"use client";
import { Card, CardBody } from "@nextui-org/react";
import { CldImage } from "next-cloudinary";

import { Event } from "@/app/lib/definitions";

export default function MiniEventCard({ event }: { event: Event }) {
  return (
    <div className="flex flex-col items-stretch gap-2 place-self-center self-stretch min-w-[300px] max-w-[400px]">
      <Card
        isBlurred
        className="bg-gradient-to-r from-yellow-200 from-10% via-yellow-500 via-50% to-yellow-200 to-100%"
      >
        <CardBody>
          <div className="flex flex-col justify-center item-center align-center">
            <p className="text-2xl overflow-hidden whitespace-nowrap">
              {event.event_index}
            </p>
            <p className="text-2xl overflow-hidden whitespace-nowrap">
              {!!event.event_start_date
                ? new Date(event.event_start_date).toISOString().split("T")[0]
                : String(event.event_start_date)}
              {!!event.event_end_date &&
              new Date(event.event_start_date).toISOString().split("T")[0] !=
                new Date(event.event_end_date).toISOString().split("T")[0]
                ? " - " +
                  new Date(event.event_end_date).toISOString().split("T")[0]
                : ""}
            </p>
            <p className="text-2xl overflow-hidden whitespace-nowrap">
              {!!event.event_lunar_start_date
                ? event.event_lunar_start_date
                : ""}
              {!!event.event_lunar_end_date &&
              event.event_lunar_start_date != event.event_lunar_end_date
                ? " - " + event.event_lunar_end_date
                : ""}
            </p>
            <div className="self-center w-[250px] h-[250px]">
              <CldImage
                alt="Event Picture"
                className="object-cover rounded-xl"
                crop={{
                  type: "auto",
                  source: true,
                }}
                height={250}
                src={"event_" + String(event.event_id)}
                width={250}
              />
            </div>
            <p className="text-2xl">{`${event.event_name}`}</p>
            <p className="text-2xl">{`(${event.event_cn_name})`}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
