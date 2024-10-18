"use client";
import { Card, CardBody } from "@nextui-org/react";
import { CldImage } from "next-cloudinary";

import { Plan } from "@/app/lib/definitions";

export default function MiniPlanCard({ plan }: { plan: Plan }) {
  return (
    <div className="flex flex-col items-stretch gap-2 place-self-center self-stretch min-w-[300px] max-w-[400px]">
      <Card
        isBlurred
        className="bg-gradient-to-r from-rose-200 from-10% via-rose-50 via-50% to-rose-200 to-100%"
      >
        <CardBody>
          <div className="flex flex-col justify-center item-center align-center">
            <p className="text-2xl">{`${plan.plan_name}`}</p>
            <p className="text-2xl">{`(${plan.plan_cn_name})`}</p>
            <div className="self-center w-[250px] h-[250px]">
              <CldImage
                alt="Plan Picture"
                className="object-cover rounded-xl"
                crop={{
                  type: "auto",
                  source: true,
                }}
                height={250}
                src={"plan_" + String(plan.plan_id)}
                width={250}
              />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
