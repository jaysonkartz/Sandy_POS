"use client";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Image,
  Spacer,
} from "@nextui-org/react";

import { Plan } from "@/app/lib/definitions";

import PlanDetailsCard from "./plan_card details_button";

export default function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div className="flex flex-col items-stretch gap-2 place-self-center self-stretch max-w-[400px]">
      <Card
        isBlurred
        className="bg-gradient-to-r from-rose-200 from-10% via-rose-50 via-50% to-rose-200 to-100%"
      >
        <CardHeader>
          <div className="flex flex-col justify-center item-center align-center">
            <p className="text-2xl">{`${plan.plan_name}`}</p>
            <p className="text-2xl">{`(${plan.plan_cn_name})`}</p>
            <div className="self-center">
              <Image
                alt="Plan Picture"
                className="object-cover rounded-xl"
                src="https://nextui.org/images/hero-card-complete.jpeg"
                width={400}
              />
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <p>{plan.plan_description}</p>
          <Spacer y={4} />
          <p>{plan.plan_cn_description}</p>
          <Spacer y={4} />
          <Divider />
          <Spacer y={4} />
          <div className="flex justify-center gap-x-10">
            <PlanDetailsCard plan={plan} />
          </div>
        </CardBody>
        <Divider />
      </Card>
    </div>
  );
}
