"use client";

import Link from "next/link";
import { useState } from 'react';
import { Input } from "@nextui-org/react";

import { Button } from "@/app/ui/button";
import { State } from "@/app/lib/actions";

import { DisplayColumns } from "../lib/definitions";

export default function CreateForm<T>({
  entity,
  prevPage,
  inputFields,
  createAction,
}: {
  entity: string;
  prevPage: string;
  inputFields: DisplayColumns<T>[];
  createAction: (state: State, formData: FormData) => State | Promise<State>;
}) {
  const initialState: State = { message: null };
  const [state, setState] = useState(initialState);

  async function handleSubmit(formData: FormData) {
    const result = await createAction(state, formData);
    setState(result);
  }

  return (
    <form action={handleSubmit}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {inputFields.map(({ name, uid, type, required }) => (
          <div key={String(uid)} className="mb-4">
            <label className="mb-2 block text-sm font-medium" htmlFor={name}>
              {name}
            </label>
            <Input
              errorMessage={state.errors?.[uid]?.[0]}
              id={String(uid)}
              isInvalid={
                state.errors != undefined &&
                state.errors[String(uid)] != undefined
              }
              isRequired={required}
              name={String(uid)}
              type={type}
            />
          </div>
        ))}
        <div aria-atomic="true" aria-live="polite">
          {state.message ? (
            <p className="mt-2 text-sm text-red-500">{state.message}</p>
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
        <Button type="submit">Create {entity}</Button>
      </div>
    </form>
  );
}
