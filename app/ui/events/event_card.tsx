"use client";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Image,
  Spacer,
} from "@nextui-org/react";

import { Event } from "@/app/lib/definitions";

import EventDetailsCard from "./event_card details_button";
import EventAttendanceQRCard from "./event_attendance_qr";

export default function EventCard({ event }: { event: Event }) {
  return (
    <div className="flex flex-col items-stretch gap-2 place-self-center self-stretch max-w-[400px]">
      <Card
        isBlurred
        className="bg-gradient-to-r from-yellow-200 from-10% via-yellow-500 via-50% to-yellow-200 to-100%"
      >
        <CardHeader>
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
            <div className="self-center">
              <Image
                alt="Event Picture"
                className="object-cover rounded-xl"
                src="https://nextui.org/images/hero-card-complete.jpeg"
                width={400}
              />
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <p className="text-2xl">{`${event.event_name}`}</p>
          <p className="text-2xl">{`(${event.event_cn_name})`}</p>
          <Spacer y={4} />
          <p>{event.event_description}</p>
          <Spacer y={4} />
          <p>{event.event_cn_description}</p>
          <Spacer y={4} />
          <Divider />
          <Spacer y={4} />
          <div className="flex justify-center gap-x-10">
            <EventAttendanceQRCard event={event} />
            <EventDetailsCard event={event} />
          </div>
        </CardBody>
        <Divider />
      </Card>
    </div>
  );
}
