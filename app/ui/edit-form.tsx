"use client";

import Link from "next/link";
import {useFormState} from 'react-dom'
import { Input } from "@nextui-org/react";

import { Button } from "@/app/ui/button";
import { State } from "@/app/lib/actions";

import { DisplayColumns } from "../lib/definitions";

export default function EditForm<T>({
  entityOfId,
  entity,
  prevPage,
  inputFields,
  updateAction,
}: {
  entityOfId: T;
  entity: string;
  prevPage: string;
  inputFields: DisplayColumns<T>[];
  updateAction: (state: State, formData: FormData) => State | Promise<State>;
}) {
  const initialState: State = { message: null, errors: {} };
  const [formData, formAction] = useActionState(updateAction, initialState);

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {inputFields.map(({ name, uid, type, required }) => (
          <div key={uid.toString()} className="mb-4">
            <label className="mb-2 block text-sm font-medium" htmlFor={name}>
              {name}
            </label>
            <Input
              defaultValue={
                type === "date" && !!entityOfId[uid]
                  ? new Date(String(entityOfId[uid])).toISOString().slice(0, 10)
                  : String(entityOfId[uid])
              }
              errorMessage={formData.errors?.[uid]?.[0]} // Using dynamic indexing safely
              id={String(uid)}
              isInvalid={
                formData.errors != undefined &&
                formData.errors[String(uid)] != undefined
              }
              isRequired={required}
              name={String(uid)}
              type={type}
            />
          </div>
        ))}
        <div aria-atomic="true" aria-live="polite">
          {formData.message ? (
            <p className="my-2 text-sm text-red-500">{formData.message}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          href={prevPage}
        >
          Cancel
        </Link>
        <Button type="submit">Edit {entity}</Button>
      </div>
    </form>
  );
}
