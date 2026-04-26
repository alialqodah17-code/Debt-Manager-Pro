import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, debtsTable, paymentsTable } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../lib/auth";
import { getOrCreateProfile } from "./profile";

const router: IRouter = Router();

router.get("/summary", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const profile = await getOrCreateProfile(userId);

  const debts = await db
    .select()
    .from(debtsTable)
    .where(eq(debtsTable.userId, userId))
    .orderBy(desc(debtsTable.createdAt));

  const paidRows = await db
    .select({
      debtId: paymentsTable.debtId,
      total: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)`,
    })
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, userId))
    .groupBy(paymentsTable.debtId);

  const paidMap = new Map<string, number>();
  for (const r of paidRows) paidMap.set(r.debtId, Number(r.total));

  let totalOwedToMe = 0;
  let totalIOwe = 0;
  let openCount = 0;
  let settledCount = 0;

  for (const d of debts) {
    const paid = paidMap.get(d.id) ?? 0;
    const remaining = Math.max(0, Number(d.amount) - paid);
    if (d.status === "settled") settledCount++;
    else openCount++;
    if (d.direction === "owed_to_me") totalOwedToMe += remaining;
    else totalIOwe += remaining;
  }

  const recentDebts = debts.slice(0, 5).map((d) => {
    const paid = paidMap.get(d.id) ?? 0;
    const amount = Number(d.amount);
    return {
      id: d.id,
      personName: d.personName,
      direction: d.direction,
      amount,
      paidAmount: paid,
      remainingAmount: Math.max(0, amount - paid),
      currency: d.currency,
      note: d.note,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  });

  res.json({
    currency: profile.currency,
    totalOwedToMe,
    totalIOwe,
    netBalance: totalOwedToMe - totalIOwe,
    openDebtsCount: openCount,
    settledDebtsCount: settledCount,
    recentDebts,
  });
});

export default router;
