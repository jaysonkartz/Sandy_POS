"use client";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { QRCodeSVG } from "qrcode.react";

import { Event } from "@/app/lib/definitions";

export default function EventAttendanceQRCard({ event }: { event: Event }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div className="flex flex-col gap-2 place-self-center max-w-[400px]">
      <Button
        className="max-w-fit bg-yellow-800 text-white opacity-75"
        onPress={onOpen}
      >
        Check In
      </Button>
      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {`${event.event_name} (${event.event_cn_name})`}
              </ModalHeader>
              <ModalBody>
                <div className="self-center">
                  <QRCodeSVG
                    size={256}
                    value="https://project-bob-derrik.vercel.app/dashboard/samples"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary">Purchase</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
