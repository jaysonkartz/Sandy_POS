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

import { eventColumns } from "@/app/lib/data";
import { Event } from "@/app/lib/definitions";
import { DeleteEntity, UpdateEntity } from "@/app/ui/entity-buttons";
import { deleteEvent } from "@/app/lib/actions";

type ENTITY_TYPE = Event;
const TABLE_NAME = "Events Table";
const LOWER_ENTITIES = "events";
const ID_KEY = "event_id";
const COLUMN_HEADER = eventColumns;
const DELETE_ACTION = deleteEvent;

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
                      id={item[ID_KEY].toString()}
                    />
                    <CldUploadWidget
                      options={{
                        publicId: "event_" + String(item.event_id),
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
