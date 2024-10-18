import { Plan } from "@/app/lib/definitions";
import PlanCard from "@/app/ui/plans/plan_card";

export default function PlanTableCustomer({ data }: { data: Array<Plan> }) {
  return (
    <div className="grid grid-flow-row-dense grid-cols-1 gap-2 xl:grid-cols-4 items-stretch">
      {data.map((item: Plan) => (
        <PlanCard key={item.plan_id} plan={item} />
      ))}
    </div>
  );
}
