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
} from "@nextui-org/react";

export default function EventOrderCard() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div className="flex flex-col gap-2">
      <Card isBlurred className="max-w-[400px] bg-violet-300">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md">Zoey Lang</p>
            <p className="text-small">Expire: 2024-12-31</p>
            <p className="text-small">Lot: 3322</p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <Button className="max-w-fit" color="primary" onPress={onOpen}>
            Details
          </Button>
        </CardBody>
        <Divider />
      </Card>
      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Zoey Lang
              </ModalHeader>
              <ModalBody>
                <Card isBlurred className="max-w-[400px] bg-violet-300">
                  <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                      <p className="text-md">Zoey Lang</p>
                      <p className="text-small">Expire: 2024-12-31</p>
                      <p className="text-small">Lot: 3322</p>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <div className="flex flex-col">
                      <Image
                        alt="Card background"
                        className="object-cover rounded-xl"
                        src="https://nextui.org/images/hero-card-complete.jpeg"
                        width={400}
                      />
                      <div className="flex flex-row gap-x-2">
                        <p>Contact:</p>
                        <p>92341145</p>
                      </div>
                      <div className="flex flex-row gap-x-2">
                        <p>Start:</p>
                        <p>2024-12-31</p>
                      </div>
                      <div className="flex flex-row gap-x-2">
                        <p>Address:</p>
                        <p>Blk 338 Corporatinon rise #20-022</p>
                      </div>
                      <div className="flex flex-row gap-x-2">
                        <p>Postal:</p>
                        <p>92341145</p>
                      </div>
                      <div className="flex flex-row gap-x-2">
                        <p>Price (SGD):</p>
                        <p>128</p>
                      </div>
                      <div className="flex flex-row gap-x-2">
                        <p>InoviceID:</p>
                        <p>788</p>
                      </div>
                    </div>
                  </CardBody>
                  <Divider />
                </Card>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
