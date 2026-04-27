import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  profilesTable,
  DEFAULT_SHORTCUTS,
  type AmountShortcut,
} from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

function sanitizeShortcuts(input: unknown): AmountShortcut[] | null {
  if (!Array.isArray(input)) return null;
  const out: AmountShortcut[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const id = typeof r["id"] === "string" ? r["id"] : null;
    const label = typeof r["label"] === "string" ? r["label"] : null;
    const value = typeof r["value"] === "number" ? r["value"] : null;
    const kind = r["kind"] === "fraction" || r["kind"] === "fixed" ? r["kind"] : null;
    if (!id || !label || value === null || !kind) continue;
    if (!(value > 0)) continue;
    if (kind === "fraction" && value > 1) continue;
    out.push({ id, label, value, kind });
  }
  return out;
}

function serializeProfile(p: typeof profilesTable.$inferSelect) {
  return {
    userId: p.userId,
    currency: p.currency,
    language: p.language,
    amountShortcuts: p.amountShortcuts ?? DEFAULT_SHORTCUTS,
    createdAt: p.createdAt.toISOString(),
  };
}

async function getOrCreateProfile(userId: string) {
  const existing = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);
  if (existing.length > 0) return existing[0]!;
  const [created] = await db
    .insert(profilesTable)
    .values({
      userId,
      currency: "USD",
      language: "en",
      amountShortcuts: DEFAULT_SHORTCUTS,
    })
    .returning();
  return created!;
}

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const profile = await getOrCreateProfile(userId);
  res.json(serializeProfile(profile));
});

router.put("/me", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  await getOrCreateProfile(userId);
  const body = req.body as {
    currency?: string;
    language?: "en" | "ar";
    amountShortcuts?: unknown;
  };
  const update: Partial<{
    currency: string;
    language: string;
    amountShortcuts: AmountShortcut[];
    updatedAt: Date;
  }> = {
    updatedAt: new Date(),
  };
  if (typeof body.currency === "string" && body.currency.length > 0) {
    update.currency = body.currency.toUpperCase();
  }
  if (body.language === "en" || body.language === "ar") {
    update.language = body.language;
  }
  if (body.amountShortcuts !== undefined) {
    const cleaned = sanitizeShortcuts(body.amountShortcuts);
    if (cleaned !== null) {
      update.amountShortcuts = cleaned;
    }
  }
  const [updated] = await db
    .update(profilesTable)
    .set(update)
    .where(eq(profilesTable.userId, userId))
    .returning();
  res.json(serializeProfile(updated!));
});

export default router;
export { getOrCreateProfile };
