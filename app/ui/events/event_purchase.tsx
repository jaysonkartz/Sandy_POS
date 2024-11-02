"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Spacer,
  Image,
} from "@nextui-org/react";

import { CreateEventOrder, State } from "@/app/lib/actions";
import { Event } from "@/app/lib/definitions";

import { lusitana } from "../fonts";

export default function EventPurchase({ entityOfId }: { entityOfId: Event }) {
  const initialState: State = { message: null, errors: {} };
  const [formData, formAction] = useActionState(CreateEventOrder, initialState);
  const [counter, setCounter] = useState(1);
  const maxPage = 3;
  const nextPage = () => {
    if (counter < maxPage) setCounter(counter + 1);
  };
  const prevPage = () => {
    if (counter > 1) setCounter(counter - 1);
  };

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        <h1 className={`${lusitana.className} text-2xl`}>
          {`Step ${counter} of ${maxPage}`}
        </h1>
        <div aria-atomic="true" aria-live="polite">
          {formData.message ? (
            <p className="my-2 text-sm text-red-500">{formData.message}</p>
          ) : null}
        </div>
      </div>
      <div className="flex justify-end gap-4 my-4">
        <Link
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          href="/events"
        >
          Cancel
        </Link>
        <Button type="button" onClick={prevPage}>
          Previous page
        </Button>
        <Button type="button" onClick={nextPage}>
          Next page
        </Button>
      </div>
      {counter == 1 ? (
        <div>
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
                <p className="text-2xl">{`${entityOfId.event_name}`}</p>
                <p className="text-2xl">{`(${entityOfId.event_cn_name})`}</p>
                <div>
                  <p>Description:</p>
                  <p>{entityOfId.event_description}</p>
                  <Spacer y={4} />
                  <p>{entityOfId.event_cn_description}</p>
                </div>
                <Spacer y={4} />
                <div>
                  <p>Benefits:</p>
                  <p>{entityOfId.event_benefits}</p>
                  <Spacer y={4} />
                  <p>{entityOfId.event_cn_benefits}</p>
                </div>
                <Spacer y={4} />
                <div>
                  <p>Cost:</p>
                  <p>{`SGD $${entityOfId.event_price}`}</p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card isBlurred>
            <CardHeader className="flex gap-3">Add-On</CardHeader>
            <Divider />
            <CardBody>
              <div className="grid grid-flow-row-dense grid-cols-1 gap-2">
                Selections
              </div>
            </CardBody>
          </Card>
        </div>
      ) : (
        ""
      )}
      {counter == 2 ? (
        <div>
          <div>Customer Information / Retrieval</div>
        </div>
      ) : (
        ""
      )}
      {counter == 3 ? (
        <div>
          <div>Payment</div>
        </div>
      ) : (
        ""
      )}
      {counter == maxPage ? (
        <div className="mt-6 flex justify-end gap-4">
          <Button type="submit">Purchase Events</Button>
        </div>
      ) : (
        ""
      )}
    </form>
  );
}
