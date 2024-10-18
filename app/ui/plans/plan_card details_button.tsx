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
} from "@nextui-org/react";

import { Plan } from "@/app/lib/definitions";

export default function PlanDetailsCard({ plan }: { plan: Plan }) {
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
              <ModalHeader className="flex flex-col gap-1 bg-gradient-to-r from-rose-200 from-10% via-rose-50 via-50% to-rose-200 to-100% text-2xl">
                {`${plan.plan_name} (${plan.plan_cn_name})`}
              </ModalHeader>
              <ModalBody className="bg-gradient-to-r from-rose-200 from-10% via-rose-50 via-50% to-rose-200 to-100%">
                <Card isBlurred>
                  <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                      <Image
                        alt="Plan Picture"
                        className="object-cover rounded-xl"
                        src="https://nextui.org/images/hero-card-complete.jpeg"
                        width={400}
                      />
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <div className="grid grid-flow-row-dense grid-cols-1 gap-2">
                      <div>
                        <p>Description:</p>
                        <p>{plan.plan_description}</p>
                        <Spacer y={4} />
                        <p>{plan.plan_cn_description}</p>
                      </div>
                      <Spacer y={4} />
                      <div>
                        <p>Benefits:</p>
                        <p>{plan.plan_benefits}</p>
                        <Spacer y={4} />
                        <p>{plan.plan_cn_benefits}</p>
                      </div>
                      <div>
                        <p>Total Slots:</p>
                        <p>{plan.total_slots}</p>
                      </div>
                    </div>
                  </CardBody>
                  <Divider />
                </Card>
              </ModalBody>
              <ModalFooter className="bg-gradient-to-r from-rose-200 from-10% via-rose-50 via-50% to-rose-200 to-100%">
                <Button
                  className="max-w-fit bg-yellow-800 text-white opacity-75"
                  onPress={onClose}
                >
                  Close
                </Button>
                <Button className="max-w-fit bg-yellow-800 text-white opacity-75">
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
