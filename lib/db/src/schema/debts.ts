import {
  pgTable,
  text,
  timestamp,
  numeric,
  index,
} from "drizzle-orm/pg-core";

export const debtsTable = pgTable(
  "debts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    personName: text("person_name").notNull(),
    direction: text("direction").notNull(), // 'owed_to_me' | 'i_owe'
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    note: text("note"),
    phone: text("phone"),
    status: text("status").notNull().default("open"), // 'open' | 'settled'
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("debts_user_idx").on(t.userId),
  }),
);

export type Debt = typeof debtsTable.$inferSelect;
export type InsertDebt = typeof debtsTable.$inferInsert;
