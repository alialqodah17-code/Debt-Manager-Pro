import { getCurrency } from "./currencies";
import type { Language } from "@/i18n/translations";

export function formatAmount(
  amount: number,
  currencyCode: string,
  lang: Language,
): string {
  const currency = getCurrency(currencyCode);
  const formatted = new Intl.NumberFormat(lang === "ar" ? "ar" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency.symbol}`;
}

export function formatCompactAmount(
  amount: number,
  currencyCode: string,
  lang: Language,
): string {
  const currency = getCurrency(currencyCode);
  const formatted = new Intl.NumberFormat(lang === "ar" ? "ar" : "en-US", {
    notation: amount >= 10000 ? "compact" : "standard",
    minimumFractionDigits: amount >= 10000 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency.symbol}`;
}

export function formatDate(dateString: string, lang: Language): string {
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const time = d.toLocaleTimeString(lang === "ar" ? "ar" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffDays === 0) {
    return lang === "ar" ? `اليوم · ${time}` : `Today · ${time}`;
  }
  if (diffDays === 1) {
    return lang === "ar" ? `أمس · ${time}` : `Yesterday · ${time}`;
  }

  return d.toLocaleDateString(lang === "ar" ? "ar" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateShort(dateString: string, lang: Language): string {
  const d = new Date(dateString);
  return d.toLocaleDateString(lang === "ar" ? "ar" : "en-US", {
    month: "short",
    day: "numeric",
  });
}
