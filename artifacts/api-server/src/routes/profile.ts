import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

async function getOrCreateProfile(userId: string) {
  const existing = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);
  if (existing.length > 0) return existing[0]!;
  const [created] = await db
    .insert(profilesTable)
    .values({ userId, currency: "USD", language: "en" })
    .returning();
  return created!;
}

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const profile = await getOrCreateProfile(userId);
  res.json({
    userId: profile.userId,
    currency: profile.currency,
    language: profile.language,
    createdAt: profile.createdAt.toISOString(),
  });
});

router.put("/me", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  await getOrCreateProfile(userId);
  const body = req.body as { currency?: string; language?: "en" | "ar" };
  const update: Partial<{ currency: string; language: string; updatedAt: Date }> = {
    updatedAt: new Date(),
  };
  if (typeof body.currency === "string" && body.currency.length > 0) {
    update.currency = body.currency.toUpperCase();
  }
  if (body.language === "en" || body.language === "ar") {
    update.language = body.language;
  }
  const [updated] = await db
    .update(profilesTable)
    .set(update)
    .where(eq(profilesTable.userId, userId))
    .returning();
  res.json({
    userId: updated!.userId,
    currency: updated!.currency,
    language: updated!.language,
    createdAt: updated!.createdAt.toISOString(),
  });
});

export default router;
export { getOrCreateProfile };
