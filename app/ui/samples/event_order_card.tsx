import { Card, CardBody, CardHeader, Divider } from "@nextui-org/react";

export default function EventOrderCard() {
  return (
    <Card isBlurred className="bg-violet-300">
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-md">Zoey Lang</p>
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
            <p>Address:</p>
            <p>Blk 338 Corporatinon rise #20-022</p>
          </div>
          <div className="flex flex-row gap-x-2">
            <p>Postal:</p>
            <p>92341145</p>
          </div>
          <div className="flex flex-row gap-x-2">
            <p>Birthday:</p>
            <p>2024-02-03</p>
          </div>
          <div className="flex flex-row gap-x-2">
            <p>Birthtime:</p>
            <p>11:03</p>
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
