"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";

import { personColumns } from "@/app/lib/data";
import { Person } from "@/app/lib/definitions";
import { DeleteEntity, UpdateEntity } from "@/app/ui/entity-buttons";
import { deletePerson } from "@/app/lib/actions";
import { PEOPLE_PAGE_CONTEXT } from "@/app/lib/page-context-data";

type ENTITY_TYPE = Person;
const TABLE_NAME = "People Table";
const LOWER_ENTITIES = "people";
const ID_KEY = "p_id";
const COLUMN_HEADER = personColumns;
const DELETE_ACTION = deletePerson;

export default function EntityTable({ data }: { data: Array<ENTITY_TYPE> }) {
  let filteredHeader: {
    name: string;
    uid: keyof ENTITY_TYPE | "actions";
    sortable: boolean;
  }[] = [];

  COLUMN_HEADER.forEach(({ name, uid, sortable }) => {
    filteredHeader.push({ name, uid, sortable });
  });
  filteredHeader.push({ name: "ACTIONS", uid: "actions", sortable: true });

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
                  <div className="flex justify-start gap-2">
                    <UpdateEntity
                      updateLink={`${PEOPLE_PAGE_CONTEXT.BASE_URL}/${item[ID_KEY]}/edit`}
                    />
                    <DeleteEntity
                      deleteAction={DELETE_ACTION}
                      id={item[ID_KEY]}
                    />
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
