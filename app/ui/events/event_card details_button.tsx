"use client";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
  ScrollShadow,
  Spacer,
  Link,
} from "@nextui-org/react";

import { Event } from "@/app/lib/definitions";

export default function EventDetailsCard({ event }: { event: Event }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div className="flex flex-col gap-2 place-self-center max-w-[400px]">
      <Button
        className="max-w-fit bg-yellow-800 text-white opacity-75"
        onPress={onOpen}
      >
        Details
      </Button>
      <Modal isOpen={isOpen} placement="auto" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <ScrollShadow className="h-[400px] xl:h-[600px]">
              <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-yellow-200 from-10% via-yellow-500 via-50% to-yellow-200 to-100% text-2xl">
                <p className="text-2xl overflow-hidden whitespace-nowrap">
                  {event.event_index}
                </p>
                <p className="text-2xl overflow-hidden whitespace-nowrap">
                  {!!event.event_start_date
                    ? new Date(event.event_start_date)
                        .toISOString()
                        .split("T")[0]
                    : String(event.event_start_date)}
                  {!!event.event_end_date &&
                  new Date(event.event_start_date)
                    .toISOString()
                    .split("T")[0] !=
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
              </ModalHeader>
              <ModalBody className="bg-gradient-to-r from-yellow-200 from-10% via-yellow-500 via-50% to-yellow-200 to-100%">
                <Card isBlurred>
                  <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                      <Image
                        alt="Event Picture"
                        className="object-cover rounded-xl"
                        src="https://nextui.org/images/hero-card-complete.jpeg"
                        width={400}
                      />
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <div className="grid grid-flow-row-dense grid-cols-1 gap-2">
                      <p className="text-2xl">{`${event.event_name}`}</p>
                      <p className="text-2xl">{`(${event.event_cn_name})`}</p>
                      <div>
                        <p>Description:</p>
                        <p>{event.event_description}</p>
                        <Spacer y={4} />
                        <p>{event.event_cn_description}</p>
                      </div>
                      <Spacer y={4} />
                      <div>
                        <p>Benefits:</p>
                        <p>{event.event_benefits}</p>
                        <Spacer y={4} />
                        <p>{event.event_cn_benefits}</p>
                      </div>
                    </div>
                  </CardBody>
                  <Divider />
                </Card>
              </ModalBody>
              <ModalFooter className="bg-gradient-to-r from-yellow-200 from-10% via-yellow-500 via-50% to-yellow-200 to-100%">
                <Button
                  className="max-w-fit bg-yellow-800 text-white opacity-75"
                  onPress={onClose}
                >
                  Close
                </Button>
                <Button
                  as={Link}
                  className="max-w-fit bg-yellow-800 text-white opacity-75"
                  href={`/events/${event.event_id}/purchase`}
                >
                  Purchase
                </Button>
              </ModalFooter>
            </ScrollShadow>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
