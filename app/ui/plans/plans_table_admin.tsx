"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@nextui-org/react";
import { CldUploadWidget } from "next-cloudinary";

import { planColumns } from "@/app/lib/data";
import { Plan } from "@/app/lib/definitions";
import { DeleteEntity, UpdateEntity } from "@/app/ui/entity-buttons";
import { deletePlan } from "@/app/lib/actions";

type ENTITY_TYPE = Plan;
const TABLE_NAME = "Plans Table";
const LOWER_ENTITIES = "plans";
const ID_KEY = "plan_id";
const COLUMN_HEADER = planColumns;
const DELETE_ACTION = deletePlan;

export default function EntityTable({ data }: { data: Array<ENTITY_TYPE> }) {
  let filteredHeader: {
    name: string;
    uid: keyof ENTITY_TYPE | "actions";
    sortable: boolean;
  }[] = [];

  filteredHeader.push({ name: "ACTIONS", uid: "actions", sortable: true });
  COLUMN_HEADER.forEach(({ name, uid, sortable }) => {
    filteredHeader.push({ name, uid, sortable });
  });

  return (
    <Table
      isStriped
      aria-label={TABLE_NAME}
      classNames={{
        wrapper: "",
      }}
    >
      <TableHeader columns={filteredHeader}>
        {(column) => (
          <TableColumn key={column.uid} align="start">
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={`No ${LOWER_ENTITIES} found`} items={data}>
        {(item: ENTITY_TYPE) => (
          <TableRow key={item[ID_KEY]}>
            {filteredHeader.map(({ uid }) =>
              uid != "actions" ? (
                <TableCell key={item[ID_KEY] + uid}>
                  {String(item[uid])}
                </TableCell>
              ) : (
                <TableCell key={item[ID_KEY] + uid}>
                  <div className="flex flex-col gap-2">
                    <UpdateEntity
                      updateLink={`/dashboard/${LOWER_ENTITIES}/${item[ID_KEY]}/edit`}
                    />
                    <DeleteEntity
                      deleteAction={DELETE_ACTION}
                      id={item[ID_KEY]}
                    />
                    <CldUploadWidget
                      options={{
                        publicId: "plan_" + String(item.plan_id),
                      }}
                      signatureEndpoint="/api/sign-cloudinary-params"
                      uploadPreset="derrick_products"
                    >
                      {({ open }) => {
                        return (
                          <Button type="button" onClick={() => open()}>
                            Upload an Image
                          </Button>
                        );
                      }}
                    </CldUploadWidget>
                  </div>
                </TableCell>
              ),
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
