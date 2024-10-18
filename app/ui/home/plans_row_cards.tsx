import { Plan } from "@/app/lib/definitions";
import MiniPlanCard from "@/app/ui/plans/plan_card_mini";

export default function PlanRowCards({ data }: { data: Array<Plan> }) {
  return (
    <div className="grid grid-flow-col-dense gap-2 items-stretch overflow-x-auto">
      {data.map((item: Plan) => (
        <MiniPlanCard key={item.plan_id} plan={item} />
      ))}
    </div>
  );
}
