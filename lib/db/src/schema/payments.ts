import {
  pgTable,
  text,
  timestamp,
  numeric,
  index,
} from "drizzle-orm/pg-core";

export const paymentsTable = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    debtId: text("debt_id").notNull(),
    userId: text("user_id").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    note: text("note"),
    kind: text("kind").notNull().default("add"), // 'add' | 'deduct'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    debtIdx: index("payments_debt_idx").on(t.debtId),
    userIdx: index("payments_user_idx").on(t.userId),
  }),
);

export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = typeof paymentsTable.$inferInsert;
