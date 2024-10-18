import { PageContext } from "./definitions";

export const PEOPLE_PAGE_CONTEXT: PageContext = {
  ENTITY: "Person",
  ENTITIES: "People",
  BASE_URL: "/dashboard/people",
};

export const EVENT_ADMIN_PAGE_CONTEXT: PageContext = {
  ENTITY: "Event",
  ENTITIES: "Events",
  BASE_URL: "/dashboard/events",
};

export const EVENT_CUSTOMER_PAGE_CONTEXT: PageContext = {
  ENTITY: "Event",
  ENTITIES: "Events",
  BASE_URL: "/events",
};

export const EVENT_ORDERS_PAGE_CONTEXT: PageContext = {
  ENTITY: "Event Order",
  ENTITIES: "Event Orders",
  BASE_URL: "/dashboard/event_orders",
};

export const PLAN_ADMIN_PAGE_CONTEXT: PageContext = {
  ENTITY: "Plan",
  ENTITIES: "Plans",
  BASE_URL: "/dashboard/plans",
};

export const PLAN_ORDERS_PAGE_CONTEXT: PageContext = {
  ENTITY: "Plan Order",
  ENTITIES: "Plan Orders",
  BASE_URL: "/dashboard/plan_orders",
};
