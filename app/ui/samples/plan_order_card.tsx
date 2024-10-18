import { Card, CardBody, CardHeader, Divider } from "@nextui-org/react";

export default function PlanOrderCard() {
  return (
    <Card isBlurred className="bg-violet-300">
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
  );
}
