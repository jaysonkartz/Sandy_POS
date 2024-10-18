import { Metadata } from "next";
import { Card, CardBody, Spacer } from "@nextui-org/react";
import { LockOpenIcon } from "@heroicons/react/24/outline";

import { lusitana } from "@/app/ui/fonts";
import { fetchEventOrders, fetchPlanOrders } from "@/app/lib/data";
import {
  ApproveEntity,
  RejectEntity,
} from "@/app/ui/approvals/approval-buttons";
import {
  approveEventOrder,
  approvePlanOrder,
  rejectEventOrder,
  rejectPlanOrder,
  resetEventsOrdersPlansOrders,
} from "@/app/lib/actions";

const ENTITIES = "Approvals";

export const metadata: Metadata = {
  title: `${ENTITIES}`,
};

export default async function Page() {
  const event_order_data = await fetchEventOrders();
  const plan_order_data = await fetchPlanOrders();

  return (
    <main>
      <div className="w-full">
        <div className="flex w-full items-center justify-start gap-x-2">
          <h1 className={`${lusitana.className} text-2xl`}>{ENTITIES}</h1>
          <form action={resetEventsOrdersPlansOrders}>
            <button
              className="rounded-md border p-2 hover:bg-gray-100"
              type="submit"
            >
              <LockOpenIcon className="w-4" />
            </button>
          </form>
        </div>
        <h2 className={`${lusitana.className} text-2xl`}>Event Orders</h2>
        <div className="grid grid-flow-row-dense grid-cols-1 gap-2 lg:grid-cols-4">
          {event_order_data.map(
            ({
              event_o_id,
              purchaser,
              event_o_date,
              event_id,
              event_o_payment_status,
            }) => (
              <Card
                key={"event_order_" + event_o_id}
                isBlurred
                className={
                  event_o_payment_status == null
                    ? "bg-yellow-300"
                    : Boolean(event_o_payment_status) === true
                      ? "bg-green-300"
                      : "bg-red-300"
                }
              >
                <CardBody>
                  <div className="flex flex-col">
                    <div className="flex flex-row gap-x-2">
                      <p>Event:</p>
                      <p>{event_id}</p>
                    </div>
                    <div className="flex flex-row gap-x-2">
                      <p>Order ID:</p>
                      <p>{event_o_id}</p>
                    </div>
                    <div className="flex flex-row gap-x-2">
                      <p>Purchase Date:</p>
                      <p>{String(event_o_date)}</p>
                    </div>
                    <div className="flex flex-row gap-x-2">
                      <p>Purchaser:</p>
                      <p>{purchaser}</p>
                    </div>
                    <div
                      className={
                        event_o_payment_status == null
                          ? "flex justify-end gap-x-2"
                          : "hidden"
                      }
                    >
                      <div className="bg-green-300">
                        <ApproveEntity
                          approveAction={approveEventOrder}
                          id={event_o_id}
                        />
                      </div>
                      <div className="bg-red-300">
                        <RejectEntity
                          id={event_o_id}
                          rejectAction={rejectEventOrder}
                        />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ),
          )}
        </div>
        <Spacer y={4} />
        <h2 className={`${lusitana.className} text-2xl`}>Plan Orders</h2>
        <div className="grid grid-flow-row-dense grid-rows-1 gap-2 lg:grid-cols-4">
          {plan_order_data.map(
            ({
              plan_o_id,
              purchaser,
              plan_o_date,
              plan_id,
              plan_o_payment_status,
            }) => (
              <Card
                key={"plan_order_" + plan_o_id}
                isBlurred
                className={
                  plan_o_payment_status == null
                    ? "bg-yellow-300"
                    : Boolean(plan_o_payment_status) === true
                      ? "bg-green-300"
                      : "bg-red-300"
                }
              >
                <CardBody>
                  <div className="flex flex-col">
                    <div className="flex flex-row gap-x-2">
                      <p>Plan:</p>
                      <p>{plan_id}</p>
                    </div>
                    <div className="flex flex-row gap-x-2">
                      <p>Order ID:</p>
                      <p>{plan_o_id}</p>
                    </div>
                    <div className="flex flex-row gap-x-2">
                      <p>Purchase Date:</p>
                      <p>{String(plan_o_date)}</p>
                    </div>
                    <div className="flex flex-row gap-x-2">
                      <p>Purchaser:</p>
                      <p>{purchaser}</p>
                    </div>
                    <div
                      className={
                        plan_o_payment_status == null
                          ? "flex justify-end gap-x-2"
                          : "hidden"
                      }
                    >
                      <div className="bg-green-300">
                        <ApproveEntity
                          approveAction={approvePlanOrder}
                          id={plan_o_id}
                        />
                      </div>
                      <div className="bg-red-300">
                        <RejectEntity
                          id={plan_o_id}
                          rejectAction={rejectPlanOrder}
                        />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ),
          )}
        </div>
      </div>
    </main>
  );
}
