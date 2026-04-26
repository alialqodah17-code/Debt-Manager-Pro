export interface CurrencyInfo {
  code: string;
  symbol: string;
  nameEn: string;
  nameAr: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", symbol: "$", nameEn: "US Dollar", nameAr: "دولار أمريكي" },
  { code: "EUR", symbol: "€", nameEn: "Euro", nameAr: "يورو" },
  { code: "GBP", symbol: "£", nameEn: "British Pound", nameAr: "جنيه إسترليني" },
  { code: "SAR", symbol: "ر.س", nameEn: "Saudi Riyal", nameAr: "ريال سعودي" },
  { code: "AED", symbol: "د.إ", nameEn: "UAE Dirham", nameAr: "درهم إماراتي" },
  { code: "EGP", symbol: "ج.م", nameEn: "Egyptian Pound", nameAr: "جنيه مصري" },
  { code: "JOD", symbol: "د.أ", nameEn: "Jordanian Dinar", nameAr: "دينار أردني" },
  { code: "KWD", symbol: "د.ك", nameEn: "Kuwaiti Dinar", nameAr: "دينار كويتي" },
  { code: "QAR", symbol: "ر.ق", nameEn: "Qatari Riyal", nameAr: "ريال قطري" },
  { code: "BHD", symbol: "د.ب", nameEn: "Bahraini Dinar", nameAr: "دينار بحريني" },
  { code: "OMR", symbol: "ر.ع", nameEn: "Omani Rial", nameAr: "ريال عماني" },
  { code: "TRY", symbol: "₺", nameEn: "Turkish Lira", nameAr: "ليرة تركية" },
  { code: "MAD", symbol: "د.م", nameEn: "Moroccan Dirham", nameAr: "درهم مغربي" },
  { code: "TND", symbol: "د.ت", nameEn: "Tunisian Dinar", nameAr: "دينار تونسي" },
  { code: "DZD", symbol: "د.ج", nameEn: "Algerian Dinar", nameAr: "دينار جزائري" },
  { code: "IQD", symbol: "د.ع", nameEn: "Iraqi Dinar", nameAr: "دينار عراقي" },
  { code: "LBP", symbol: "ل.ل", nameEn: "Lebanese Pound", nameAr: "ليرة لبنانية" },
  { code: "SYP", symbol: "ل.س", nameEn: "Syrian Pound", nameAr: "ليرة سورية" },
  { code: "YER", symbol: "ر.ي", nameEn: "Yemeni Rial", nameAr: "ريال يمني" },
  { code: "INR", symbol: "₹", nameEn: "Indian Rupee", nameAr: "روبية هندية" },
  { code: "PKR", symbol: "₨", nameEn: "Pakistani Rupee", nameAr: "روبية باكستانية" },
  { code: "CAD", symbol: "C$", nameEn: "Canadian Dollar", nameAr: "دولار كندي" },
  { code: "AUD", symbol: "A$", nameEn: "Australian Dollar", nameAr: "دولار أسترالي" },
  { code: "JPY", symbol: "¥", nameEn: "Japanese Yen", nameAr: "ين ياباني" },
  { code: "CNY", symbol: "¥", nameEn: "Chinese Yuan", nameAr: "يوان صيني" },
];

export function getCurrency(code: string): CurrencyInfo {
  return (
    CURRENCIES.find((c) => c.code === code.toUpperCase()) ?? {
      code: code.toUpperCase(),
      symbol: code.toUpperCase(),
      nameEn: code.toUpperCase(),
      nameAr: code.toUpperCase(),
    }
  );
}
