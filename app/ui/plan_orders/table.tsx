"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";

import { planOrderColumns } from "@/app/lib/data";
import { PlanOrder } from "@/app/lib/definitions";
import { DeleteEntity, UpdateEntity } from "@/app/ui/entity-buttons";
import { deletePlanOrder } from "@/app/lib/actions";
import { PLAN_ORDERS_PAGE_CONTEXT } from "@/app/lib/page-context-data";

type ENTITY_TYPE = PlanOrder;
const TABLE_NAME = "Plan Orders Table";
const LOWER_ENTITIES = "plan orders";
const ID_KEY = "plan_o_id";
const COLUMN_HEADER = planOrderColumns;
const DELETE_ACTION = deletePlanOrder;

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
                      updateLink={`${PLAN_ORDERS_PAGE_CONTEXT.BASE_URL}/${item[ID_KEY]}/edit`}
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
