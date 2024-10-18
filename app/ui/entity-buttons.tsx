import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@nextui-org/react";
import Link from "next/link";

export function CreateEntity({
  entity,
  createLink,
}: {
  entity: string;
  createLink: string;
}) {
  return (
    <Link
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      href={createLink}
    >
      <span className="hidden md:block">Create {entity}</span>{" "}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateEntity({ updateLink }: { updateLink: string }) {
  return (
    <Button
      as={Link}
      className="rounded-md border p-2 hover:bg-gray-100 w-full"
      href={updateLink}
    >
      <span className="sr-only">Edit</span>
      <PencilIcon className="w-5" />
    </Button>
  );
}

export function DeleteEntity({
  id,
  deleteAction,
}: {
  id: string;
  deleteAction: (id: string) => Promise<{ message: string } | undefined>;
}) {
  const deleteWithId = deleteAction.bind(null, id);

  return (
    <form action={deleteWithId}>
      <Button
        className="rounded-md border p-2 hover:bg-gray-100 w-full"
        type="submit"
      >
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </Button>
    </form>
  );
}
