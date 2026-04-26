import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  debtsTable,
  paymentsTable,
} from "@workspace/db";
import { newId, requireAuth, type AuthedRequest } from "../lib/auth";
import { getOrCreateProfile } from "./profile";

const router: IRouter = Router();

type DebtRow = typeof debtsTable.$inferSelect;
type PaymentRow = typeof paymentsTable.$inferSelect;

function serializePayment(p: PaymentRow) {
  return {
    id: p.id,
    debtId: p.debtId,
    amount: Number(p.amount),
    note: p.note,
    createdAt: p.createdAt.toISOString(),
  };
}

function serializeDebt(d: DebtRow, paid: number) {
  const amount = Number(d.amount);
  const remaining = Math.max(0, amount - paid);
  return {
    id: d.id,
    personName: d.personName,
    direction: d.direction,
    amount,
    paidAmount: paid,
    remainingAmount: remaining,
    currency: d.currency,
    note: d.note,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

async function getPaidMap(userId: string, debtIds: string[]) {
  if (debtIds.length === 0) return new Map<string, number>();
  const rows = await db
    .select({
      debtId: paymentsTable.debtId,
      total: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)`,
    })
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, userId))
    .groupBy(paymentsTable.debtId);
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.debtId, Number(row.total));
  }
  return map;
}

router.get("/debts", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const direction = req.query["direction"] as string | undefined;
  const status = req.query["status"] as string | undefined;

  const conditions = [eq(debtsTable.userId, userId)];
  if (direction === "owed_to_me" || direction === "i_owe") {
    conditions.push(eq(debtsTable.direction, direction));
  }
  if (status === "open" || status === "settled") {
    conditions.push(eq(debtsTable.status, status));
  }

  const rows = await db
    .select()
    .from(debtsTable)
    .where(and(...conditions))
    .orderBy(desc(debtsTable.createdAt));

  const paidMap = await getPaidMap(
    userId,
    rows.map((r) => r.id),
  );
  res.json(rows.map((r) => serializeDebt(r, paidMap.get(r.id) ?? 0)));
});

router.post("/debts", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const body = req.body as {
    personName?: string;
    direction?: string;
    amount?: number;
    note?: string | null;
  };
  if (
    !body.personName ||
    !body.personName.trim() ||
    (body.direction !== "owed_to_me" && body.direction !== "i_owe") ||
    typeof body.amount !== "number" ||
    !(body.amount > 0)
  ) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const profile = await getOrCreateProfile(userId);
  const id = newId();
  const [created] = await db
    .insert(debtsTable)
    .values({
      id,
      userId,
      personName: body.personName.trim(),
      direction: body.direction,
      amount: body.amount.toFixed(2),
      currency: profile.currency,
      note: body.note ?? null,
      status: "open",
    })
    .returning();
  res.status(201).json(serializeDebt(created!, 0));
});

async function loadDebtWithPayments(userId: string, id: string) {
  const debt = await db
    .select()
    .from(debtsTable)
    .where(and(eq(debtsTable.id, id), eq(debtsTable.userId, userId)))
    .limit(1);
  if (debt.length === 0) return null;
  const payments = await db
    .select()
    .from(paymentsTable)
    .where(
      and(eq(paymentsTable.debtId, id), eq(paymentsTable.userId, userId)),
    )
    .orderBy(desc(paymentsTable.createdAt));
  const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  return {
    ...serializeDebt(debt[0]!, paid),
    payments: payments.map(serializePayment),
  };
}

router.get("/debts/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = String(req.params.id);
  const result = await loadDebtWithPayments(userId, id);
  if (!result) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result);
});

router.put("/debts/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = String(req.params.id);
  const body = req.body as {
    personName?: string;
    note?: string | null;
    amount?: number;
  };
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.personName === "string" && body.personName.trim()) {
    update["personName"] = body.personName.trim();
  }
  if (body.note !== undefined) {
    update["note"] = body.note;
  }
  if (typeof body.amount === "number" && body.amount > 0) {
    update["amount"] = body.amount.toFixed(2);
  }
  const [updated] = await db
    .update(debtsTable)
    .set(update)
    .where(and(eq(debtsTable.id, id), eq(debtsTable.userId, userId)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const paidMap = await getPaidMap(userId, [updated.id]);
  res.json(serializeDebt(updated, paidMap.get(updated.id) ?? 0));
});

router.delete("/debts/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = String(req.params.id);
  // Permanent delete - debt and all its payments
  await db
    .delete(paymentsTable)
    .where(
      and(eq(paymentsTable.debtId, id), eq(paymentsTable.userId, userId)),
    );
  const deleted = await db
    .delete(debtsTable)
    .where(and(eq(debtsTable.id, id), eq(debtsTable.userId, userId)))
    .returning({ id: debtsTable.id });
  if (deleted.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(204).send();
});

router.post("/debts/:id/payments", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = String(req.params.id);
  const body = req.body as { amount?: number; note?: string | null };
  if (typeof body.amount !== "number" || !(body.amount > 0)) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const debt = await db
    .select()
    .from(debtsTable)
    .where(and(eq(debtsTable.id, id), eq(debtsTable.userId, userId)))
    .limit(1);
  if (debt.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.insert(paymentsTable).values({
    id: newId(),
    debtId: id,
    userId,
    amount: body.amount.toFixed(2),
    note: body.note ?? null,
  });

  // recompute status
  const payments = await db
    .select()
    .from(paymentsTable)
    .where(
      and(eq(paymentsTable.debtId, id), eq(paymentsTable.userId, userId)),
    );
  const paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const total = Number(debt[0]!.amount);
  const newStatus = paid >= total ? "settled" : "open";
  await db
    .update(debtsTable)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(debtsTable.id, id));

  const result = await loadDebtWithPayments(userId, id);
  res.status(201).json(result);
});

router.delete("/payments/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const paymentId = String(req.params.id);
  const existing = await db
    .select()
    .from(paymentsTable)
    .where(
      and(
        eq(paymentsTable.id, paymentId),
        eq(paymentsTable.userId, userId),
      ),
    )
    .limit(1);
  if (existing.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const debtId = existing[0]!.debtId;
  await db
    .delete(paymentsTable)
    .where(
      and(
        eq(paymentsTable.id, paymentId),
        eq(paymentsTable.userId, userId),
      ),
    );

  // recompute status
  const debt = await db
    .select()
    .from(debtsTable)
    .where(and(eq(debtsTable.id, debtId), eq(debtsTable.userId, userId)))
    .limit(1);
  if (debt.length > 0) {
    const remaining = await db
      .select()
      .from(paymentsTable)
      .where(
        and(
          eq(paymentsTable.debtId, debtId),
          eq(paymentsTable.userId, userId),
        ),
      );
    const paid = remaining.reduce((sum, p) => sum + Number(p.amount), 0);
    const total = Number(debt[0]!.amount);
    await db
      .update(debtsTable)
      .set({
        status: paid >= total ? "settled" : "open",
        updatedAt: new Date(),
      })
      .where(eq(debtsTable.id, debtId));
  }
  res.status(204).send();
});

export default router;
