"use client";

import { useState } from "react";
import { Spacer, Switch } from "@nextui-org/react";

import PlanTableAdmin from "@/app/ui/plans/plans_table_admin";
import { Plan } from "@/app/lib/definitions";

import PlanTableCustomer from "./plans_table_customer";

type ENTITY_TYPE = Plan;

export default function PlanViewAdmin({ data }: { data: Array<ENTITY_TYPE> }) {
  const [isTable, setIsTable] = useState(false);

  return (
    <div>
      <Spacer y={1} />
      <Switch isSelected={isTable} onValueChange={setIsTable}>
        Table View
      </Switch>
      <Spacer y={1} />
      {isTable ? (
        <PlanTableAdmin data={data} />
      ) : (
        <PlanTableCustomer data={data} />
      )}
    </div>
  );
}
