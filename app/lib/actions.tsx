"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type State = {
  message: string | null;
  errors?: {
    [key: string]: string[] | undefined; // Index signature for dynamic keys
  };
};

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Please enter an amount greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Invoice.",
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  // Insert data into the database
  try {
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  // Validate form using Zod
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Invoice.",
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (error) {
    return { message: "Database Error: Failed to Update Invoice." };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    return {
      message: "Database Error: Failed to Delete Invoice.",
    };
  }

  revalidatePath("/dashboard/invoices");
}

const PersonBaseSchema = z
  .object({
    p_phone: z.coerce
      .number({
        invalid_type_error: "Please enter only numbers",
      })
      .min(1, { message: "Cannot be empty" }),
    p_name: z.string(),
    p_bazi_date: z.string().date(),
    p_bazi_time: z.string(),
    p_gender: z.string(),
    p_address: z.string(),
    p_postal: z.coerce.number({
      invalid_type_error: "Please enter only numbers",
    }),
  })
  .partial();
const PersonSchema = PersonBaseSchema.required({
  p_phone: true,
});

export async function createPerson(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = PersonSchema.safeParse({
    p_phone: formData.get("p_phone"),
    p_name: formData.get("p_name"),
    p_bazi_date: formData.get("p_bazi_date"),
    p_bazi_time: formData.get("p_bazi_time"),
    p_gender: formData.get("p_gender"),
    p_address: formData.get("p_address"),
    p_postal: formData.get("p_postal"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Person.",
    };
  }

  // Prepare data for insertion into the database
  const {
    p_phone,
    p_name,
    p_bazi_date,
    p_bazi_time,
    p_gender,
    p_address,
    p_postal,
  } = validatedFields.data;
  let ISOBazi = null;

  if (!!p_bazi_date) {
    ISOBazi = new Date(p_bazi_date).toISOString().slice(0, 10);
  }
  // Insert data into the database
  try {
    await sql`
        INSERT INTO person (p_phone, p_name, p_bazi_date, p_bazi_time, p_gender, p_address, p_postal)
        VALUES (${p_phone}, ${p_name}, ${ISOBazi}, ${p_bazi_time}, ${p_gender}, ${p_address}, ${p_postal})
      `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Person.",
    };
  }

  revalidatePath("/dashboard/people");
  redirect("/dashboard/people");
}

export async function updatePerson(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = PersonSchema.safeParse({
    p_phone: formData.get("p_phone"),
    p_name: formData.get("p_name"),
    p_bazi_date: formData.get("p_bazi_date"),
    p_bazi_time: formData.get("p_bazi_time"),
    p_gender: formData.get("p_gender"),
    p_address: formData.get("p_address"),
    p_postal: formData.get("p_postal"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Person.",
    };
  }

  // Prepare data for update into the database
  const {
    p_phone,
    p_name,
    p_bazi_date,
    p_bazi_time,
    p_gender,
    p_address,
    p_postal,
  } = validatedFields.data;
  let ISOBazi = null;

  if (!!p_bazi_date) {
    ISOBazi = new Date(p_bazi_date).toISOString().slice(0, 10);
  }

  try {
    await sql`
        UPDATE person SET p_phone = ${p_phone}, p_name = ${p_name}, p_bazi_date = ${ISOBazi}, p_bazi_time = ${p_bazi_time}, p_gender = ${p_gender}, p_address = ${p_address}, p_postal = ${p_postal} WHERE p_id = ${id}
      `;
  } catch (error) {
    return { message: "Database Error: Failed to Update People." };
  }

  revalidatePath("/dashboard/people");
  redirect("/dashboard/people");
}

export async function deletePerson(id: string) {
  try {
    await sql`DELETE FROM person WHERE p_id = ${id}`;
  } catch (error) {
    return {
      message: "Database Error: Failed to Delete Person.",
    };
  }

  revalidatePath("/dashboard/people");
}

const EventSchema = z.object({
  event_index: z.string(),
  event_name: z.string(),
  event_start_date: z.string().date(),
  event_end_date: z.string().date(),
  event_description: z.string(),
  event_benefits: z.string(),
  event_cn_name: z.string(),
  event_lunar_start_date: z.string(),
  event_lunar_end_date: z.string(),
  event_cn_description: z.string(),
  event_cn_benefits: z.string(),
  event_price: z.coerce.number({
    invalid_type_error: "Please enter only numbers",
  }),
  event_remarks: z.string(),
  registration_start_date: z.string().date(),
  max_registration: z.coerce.number({
    invalid_type_error: "Please enter only numbers",
  }),
});

export async function CreateEvent(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = EventSchema.safeParse({
    event_index: formData.get("event_index"),
    event_name: formData.get("event_name"),
    event_start_date: formData.get("event_start_date"),
    event_end_date: formData.get("event_end_date"),
    event_description: formData.get("event_description"),
    event_benefits: formData.get("event_benefits"),
    event_cn_name: formData.get("event_cn_name"),
    event_lunar_start_date: formData.get("event_lunar_start_date"),
    event_lunar_end_date: formData.get("event_lunar_end_date"),
    event_cn_description: formData.get("event_cn_description"),
    event_cn_benefits: formData.get("event_cn_benefits"),
    event_price: formData.get("event_price"),
    event_remarks: formData.get("event_remarks"),
    registration_start_date: formData.get("registration_start_date"),
    max_registration: formData.get("max_registration"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Event.",
    };
  }

  // Prepare data for insertion into the database
  const {
    event_index,
    event_name,
    event_start_date,
    event_end_date,
    event_description,
    event_benefits,
    event_cn_name,
    event_lunar_start_date,
    event_lunar_end_date,
    event_cn_description,
    event_cn_benefits,
    event_price,
    event_remarks,
    registration_start_date,
    max_registration,
  } = validatedFields.data;
  const ISOStartDate = new Date(event_start_date).toISOString().slice(0, 10);
  const ISOEndDate = new Date(event_end_date).toISOString().slice(0, 10);
  const ISOStartRegistration = new Date(registration_start_date)
    .toISOString()
    .slice(0, 10);

  // Insert data into the database
  try {
    await sql`
        INSERT INTO event (event_index, event_name, event_start_date, event_end_date, event_description, event_benefits, 
        event_cn_name, event_lunar_start_date, event_lunar_end_date, event_cn_description, event_cn_benefits, 
        event_price, event_remarks, registration_start_date, max_registration)
        VALUES (${event_index}, ${event_name}, ${ISOStartDate}, ${ISOEndDate}, ${event_description}, ${event_benefits}, ${event_cn_name},
        ${event_lunar_start_date}, ${event_lunar_end_date}, ${event_cn_description}, ${event_cn_benefits}, ${event_price}, ${event_remarks},
        ${ISOStartRegistration}, ${max_registration})
      `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Event.",
    };
  }

  revalidatePath("/dashboard/events");
  redirect("/dashboard/events");
}

export async function updateEvent(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = EventSchema.safeParse({
    event_index: formData.get("event_index"),
    event_name: formData.get("event_name"),
    event_start_date: formData.get("event_start_date"),
    event_end_date: formData.get("event_end_date"),
    event_description: formData.get("event_description"),
    event_benefits: formData.get("event_benefits"),
    event_cn_name: formData.get("event_cn_name"),
    event_lunar_start_date: formData.get("event_lunar_start_date"),
    event_lunar_end_date: formData.get("event_lunar_end_date"),
    event_cn_description: formData.get("event_cn_description"),
    event_cn_benefits: formData.get("event_cn_benefits"),
    event_price: formData.get("event_price"),
    event_remarks: formData.get("event_remarks"),
    registration_start_date: formData.get("registration_start_date"),
    max_registration: formData.get("max_registration"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Event.",
    };
  }

  // Prepare data for insertion into the database
  const {
    event_index,
    event_name,
    event_start_date,
    event_end_date,
    event_description,
    event_benefits,
    event_cn_name,
    event_lunar_start_date,
    event_lunar_end_date,
    event_cn_description,
    event_cn_benefits,
    event_price,
    event_remarks,
    registration_start_date,
    max_registration,
  } = validatedFields.data;
  const ISOStartDate = new Date(event_start_date).toISOString().slice(0, 10);
  const ISOEndDate = new Date(event_end_date).toISOString().slice(0, 10);
  const ISOStartRegistration = new Date(registration_start_date)
    .toISOString()
    .slice(0, 10);

  try {
    await sql`
        UPDATE event SET event_index = ${event_index}, event_name = ${event_name}, event_start_date = ${ISOStartDate},  event_end_date = ${ISOEndDate}, event_description = ${event_description}, 
        event_benefits = ${event_benefits}, event_cn_name = ${event_cn_name}, event_lunar_start_date = ${event_lunar_start_date}, event_lunar_end_date = ${event_lunar_end_date}, 
        event_cn_description = ${event_cn_description}, event_cn_benefits = ${event_cn_benefits}, event_price = ${event_price}, 
        event_remarks = ${event_remarks}, registration_start_date =  ${ISOStartRegistration}, max_registration = ${max_registration} WHERE event_id = ${id}
      `;
  } catch (error) {
    return { message: "Database Error: Failed to Update Event." };
  }

  revalidatePath("/dashboard/events");
  redirect("/dashboard/events");
}

export async function deleteEvent(id: string) {
  try {
    await sql`DELETE FROM event WHERE event_id = ${id}`;
  } catch (error) {
    return {
      message: "Database Error: Failed to Delete Event.",
    };
  }

  revalidatePath("/dashboard/events");
}

const PlanBaseSchema = z
  .object({
    plan_name: z.string(),
    plan_start_date: z.string().date(),
    plan_end_date: z.string().date(),
    plan_description: z.string(),
    plan_benefits: z.string(),
    plan_cn_name: z.string(),
    plan_cn_description: z.string(),
    plan_cn_benefits: z.string(),
    plan_price: z.coerce.number({
      invalid_type_error: "Please enter only numbers",
    }),
    plan_remarks: z.string(),
    total_slots: z.string(),
  })
  .partial();
const PlanSchema = PlanBaseSchema.required({
  plan_name: true,
});

export async function CreatePlan(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = PlanSchema.safeParse({
    plan_name: formData.get("plan_name"),
    plan_description: formData.get("plan_description"),
    plan_start_date: formData.get("plan_start_date"),
    plan_end_date: formData.get("plan_end_date"),
    plan_benefits: formData.get("plan_benefits"),
    plan_cn_name: formData.get("plan_cn_name"),
    plan_cn_description: formData.get("plan_cn_description"),
    plan_cn_benefits: formData.get("plan_cn_benefits"),
    plan_price: formData.get("plan_price"),
    plan_remarks: formData.get("plan_remarks"),
    total_slots: formData.get("total_slots"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Plan.",
    };
  }

  // Prepare data for insertion into the database
  const {
    plan_name,
    plan_start_date,
    plan_end_date,
    plan_description,
    plan_benefits,
    plan_cn_name,
    plan_cn_description,
    plan_cn_benefits,
    plan_price,
    plan_remarks,
    total_slots,
  } = validatedFields.data;

  // Insert data into the database
  try {
    await sql`
        INSERT INTO plan (plan_name, plan_start_date, plan_end_date, plan_description, plan_benefits, 
        plan_cn_name, plan_cn_description, plan_cn_benefits, 
        plan_price, plan_remarks, total_slots)
        VALUES (${plan_name}, ${plan_start_date}, ${plan_end_date}, ${plan_description}, ${plan_benefits}, ${plan_cn_name},
        ${plan_cn_description}, ${plan_cn_benefits}, ${plan_price}, ${plan_remarks},
        ${total_slots})
      `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Plan.",
    };
  }

  revalidatePath("/dashboard/plans");
  redirect("/dashboard/plans");
}

export async function updatePlan(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = PlanSchema.safeParse({
    plan_name: formData.get("plan_name"),
    plan_description: formData.get("plan_description"),
    plan_start_date: formData.get("plan_start_date"),
    plan_end_date: formData.get("plan_end_date"),
    plan_benefits: formData.get("plan_benefits"),
    plan_cn_name: formData.get("plan_cn_name"),
    plan_cn_description: formData.get("plan_cn_description"),
    plan_cn_benefits: formData.get("plan_cn_benefits"),
    plan_price: formData.get("plan_price"),
    plan_remarks: formData.get("plan_remarks"),
    total_slots: formData.get("total_slots"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Plan.",
    };
  }

  // Prepare data for insertion into the database
  const {
    plan_name,
    plan_start_date,
    plan_end_date,
    plan_description,
    plan_benefits,
    plan_cn_name,
    plan_cn_description,
    plan_cn_benefits,
    plan_price,
    plan_remarks,
    total_slots,
  } = validatedFields.data;

  try {
    await sql`
        UPDATE plan SET plan_name = ${plan_name}, plan_start_date = ${plan_start_date},
        plan_end_date = ${plan_end_date}, plan_description = ${plan_description}, 
        plan_benefits = ${plan_benefits}, plan_cn_name = ${plan_cn_name}, 
        plan_cn_description = ${plan_cn_description}, plan_cn_benefits = ${plan_cn_benefits}, plan_price = ${plan_price}, 
        plan_remarks = ${plan_remarks}, total_slots = ${total_slots} WHERE plan_id = ${id}
      `;
  } catch (error) {
    return { message: "Database Error: Failed to Update Plan." };
  }

  revalidatePath("/dashboard/plans");
  redirect("/dashboard/plans");
}

export async function deletePlan(id: string) {
  try {
    await sql`DELETE FROM plan WHERE plan_id = ${id}`;
  } catch (error) {
    return {
      message: "Database Error: Failed to Delete Plan.",
    };
  }

  revalidatePath("/dashboard/plans");
}

const PlanOrderBaseSchema = z
  .object({
    purchaser: z.coerce.number({
      invalid_type_error: "Please enter only numbers",
    }),
    plan_id: z.coerce.number({
      invalid_type_error: "Please enter only numbers",
    }),
    plan_o_date: z.string().date(),
    plan_o_price: z.coerce.number({
      invalid_type_error: "Please enter only numbers",
    }),
    plan_o_remarks: z.string(),
    plan_o_slot: z.coerce.number(),
  })
  .partial();
const PlanOrderSchema = PlanOrderBaseSchema.required({
  purchaser: true,
  plan_id: true,
  plan_o_slot: true,
});

export async function CreatePlanOrder(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = PlanOrderSchema.safeParse({
    purchaser: formData.get("purchaser"),
    plan_id: formData.get("plan_id"),
    plan_o_date: formData.get("plan_o_date"),
    plan_o_price: formData.get("plan_o_price"),
    plan_o_remarks: formData.get("plan_o_remarks"),
    plan_o_slot: formData.get("plan_o_slot"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Plan Order.",
    };
  }

  // Prepare data for insertion into the database
  const {
    purchaser,
    plan_id,
    plan_o_date,
    plan_o_price,
    plan_o_remarks,
    plan_o_slot,
  } = validatedFields.data;

  // Insert data into the database
  try {
    await sql`
        INSERT INTO plan_order (purchaser, plan_id, plan_o_date, plan_o_price, plan_o_remarks, plan_o_slot)
        VALUES (${purchaser}, ${plan_id}, ${plan_o_date}, ${plan_o_price}, ${plan_o_remarks}, ${plan_o_slot})
      `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Plan Order.",
    };
  }

  revalidatePath("/dashboard/plan_orders");
  redirect("/dashboard/plan_orders");
}

export async function updatePlanOrder(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = PlanOrderSchema.safeParse({
    purchaser: formData.get("purchaser"),
    plan_id: formData.get("plan_id"),
    plan_o_date: formData.get("plan_o_date"),
    plan_o_price: formData.get("plan_o_price"),
    plan_o_remarks: formData.get("plan_o_remarks"),
    plan_o_slot: formData.get("plan_o_slot"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Plan Order.",
    };
  }

  // Prepare data for insertion into the database
  const {
    purchaser,
    plan_id,
    plan_o_date,
    plan_o_price,
    plan_o_remarks,
    plan_o_slot,
  } = validatedFields.data;

  try {
    await sql`
        UPDATE plan_order SET purchaser = ${purchaser}, plan_id = ${plan_id},
        plan_o_date = ${plan_o_date}, plan_o_price = ${plan_o_price}, 
        plan_o_remarks = ${plan_o_remarks}, plan_o_slot = ${plan_o_slot} WHERE plan_o_id = ${id}
      `;
  } catch (error) {
    return { message: "Database Error: Failed to Update Plan Order." };
  }

  revalidatePath("/dashboard/plan_orders");
  redirect("/dashboard/plan_orders");
}

export async function deletePlanOrder(id: string) {
  try {
    await sql`DELETE FROM plan_order WHERE plan_o_id = ${id}`;
  } catch (error) {
    return {
      message: "Database Error: Failed to Delete Plan Order.",
    };
  }

  revalidatePath("/dashboard/plan_orders");
}

export async function approvePlanOrder(id: string) {
  try {
    await sql`UPDATE plan_order SET plan_o_payment_status = TRUE WHERE plan_o_id = ${id}`;
  } catch (error) {
    return {
      message: "Database Error: Failed to Approve Plan Order.",
    };
  }

  revalidatePath("/dashboard/approvals");
}

export async function rejectPlanOrder(id: string) {
  try {
    await sql`UPDATE plan_order SET plan_o_payment_status = FALSE WHERE plan_o_id = ${id}`;
  } catch (error) {
    return {
      message: "Database Error: Failed to Approve Plan Order.",
    };
  }

  revalidatePath("/dashboard/approvals");
}

const EventOrderBaseSchema = z
  .object({
    purchaser: z.coerce.number({
      invalid_type_error: "Please enter only numbers",
    }),
    event_id: z.coerce.number({
      invalid_type_error: "Please enter only numbers",
    }),
    event_o_date: z.string().date(),
    event_o_price: z.coerce.number({
      invalid_type_error: "Please enter only numbers",
    }),
    event_o_remarks: z.string(),
    attendee_id: z.coerce.number(),
  })
  .partial();
const EventOrderSchema = EventOrderBaseSchema.required({
  purchaser: true,
  event_id: true,
  attendee_id: true,
});

export async function CreateEventOrder(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = EventOrderSchema.safeParse({
    purchaser: formData.get("purchaser"),
    event_id: formData.get("event_id"),
    event_o_date: formData.get("event_o_date"),
    event_o_price: formData.get("event_o_price"),
    event_o_remarks: formData.get("event_o_remarks"),
    attendee_id: formData.get("attendee_id"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Event Order.",
    };
  }

  // Prepare data for insertion into the database
  const {
    purchaser,
    event_id,
    event_o_date,
    event_o_price,
    event_o_remarks,
    attendee_id,
  } = validatedFields.data;

  // Insert data into the database
  try {
    await sql`
        INSERT INTO event_order (purchaser, event_id, event_o_date, event_o_price, event_o_remarks, attendee_id)
        VALUES (${purchaser}, ${event_id}, ${event_o_date}, ${event_o_price}, ${event_o_remarks}, ${attendee_id})
      `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: "Database Error: Failed to Create Event Order.",
    };
  }

  revalidatePath("/dashboard/event_orders");
  redirect("/dashboard/event_orders");
}

export async function updateEventOrder(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = EventOrderSchema.safeParse({
    purchaser: formData.get("purchaser"),
    event_id: formData.get("event_id"),
    event_o_date: formData.get("event_o_date"),
    event_o_price: formData.get("event_o_price"),
    event_o_remarks: formData.get("event_o_remarks"),
    attendee_id: formData.get("attendee_id"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Event Order.",
    };
  }

  // Prepare data for insertion into the database
  const {
    purchaser,
    event_id,
    event_o_date,
    event_o_price,
    event_o_remarks,
    attendee_id,
  } = validatedFields.data;

  try {
    await sql`
        UPDATE event_order SET purchaser = ${purchaser}, event_id = ${event_id},
        event_o_date = ${event_o_date}, event_o_price = ${event_o_price}, 
        event_o_remarks = ${event_o_remarks}, attendee_id = ${attendee_id} WHERE event_o_id = ${id}
      `;
  } catch (error) {
    return { message: "Database Error: Failed to Update Plan Order." };
  }

  revalidatePath("/dashboard/event_orders");
  redirect("/dashboard/event_orders");
}

export async function deleteEventOrder(id: string) {
  try {
    await sql`DELETE FROM event_order WHERE event_o_id = ${id}`;
  } catch (error) {
    return {
      message: "Database Error: Failed to Delete Event Order.",
    };
  }

  revalidatePath("/dashboard/event_orders");
}

export async function approveEventOrder(id: string) {
  try {
    await sql`UPDATE event_order SET event_o_payment_status = TRUE WHERE event_o_id = ${id}`;
  } catch (error) {
    return {
      message: "Database Error: Failed to Approve Event Order.",
    };
  }

  revalidatePath("/dashboard/approvals");
}

export async function rejectEventOrder(id: string) {
  try {
    await sql`UPDATE event_order SET event_o_payment_status = FALSE WHERE event_o_id = ${id}`;
  } catch (error) {
    return {
      message: "Database Error: Failed to Approve Event Order.",
    };
  }

  revalidatePath("/dashboard/approvals");
}

export async function resetEventsOrdersPlansOrders() {
  try {
    await sql`UPDATE event_order SET event_o_payment_status = NULL;`;
    await sql`UPDATE plan_order SET plan_o_payment_status = NULL;`;
  } catch (error) {
    return {
      message: "Database Error: Failed to Reset Event/Plan Order.",
    };
  }

  revalidatePath("/dashboard/approvals");
}
