import { CheckIcon, TrashIcon } from "@heroicons/react/24/outline";

export function ApproveEntity({
  id,
  approveAction,
}: {
  id: string;
  approveAction: (id: string) => Promise<{ message: string } | undefined>;
}) {
  const approveWithId = approveAction.bind(null, id);

  return (
    <form action={approveWithId}>
      <button className="rounded-md border p-2 hover:bg-gray-100" type="submit">
        <span className="sr-only">Approve</span>
        <CheckIcon className="w-4" />
      </button>
    </form>
  );
}

export function RejectEntity({
  id,
  rejectAction,
}: {
  id: string;
  rejectAction: (id: string) => Promise<{ message: string } | undefined>;
}) {
  const rejectWithId = rejectAction.bind(null, id);

  return (
    <form action={rejectWithId}>
      <button className="rounded-md border p-2 hover:bg-gray-100" type="submit">
        <span className="sr-only">Reject</span>
        <TrashIcon className="w-4" />
      </button>
    </form>
  );
}
