import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export type AmountShortcut = {
  id: string;
  label: string;
  value: number;
  kind: "fixed" | "fraction";
};

export const DEFAULT_SHORTCUTS: AmountShortcut[] = [
  { id: "half", label: "½", value: 0.5, kind: "fraction" },
  { id: "third", label: "⅓", value: 1 / 3, kind: "fraction" },
  { id: "quarter", label: "¼", value: 0.25, kind: "fraction" },
  { id: "all", label: "All", value: 1, kind: "fraction" },
];

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  currency: text("currency").notNull().default("USD"),
  language: text("language").notNull().default("en"),
  amountShortcuts: jsonb("amount_shortcuts")
    .$type<AmountShortcut[]>()
    .notNull()
    .default(DEFAULT_SHORTCUTS),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profilesTable.$inferSelect;
export type InsertProfile = typeof profilesTable.$inferInsert;
