export type Language = "en" | "ar";

export type TranslationKey =
  | "appName"
  | "tagline"
  | "welcome"
  | "signIn"
  | "signUp"
  | "signOut"
  | "continueWithGoogle"
  | "or"
  | "email"
  | "password"
  | "verificationCode"
  | "verifyEmail"
  | "weSentCode"
  | "verify"
  | "alreadyHaveAccount"
  | "noAccount"
  | "createAccount"
  | "signingIn"
  | "signingUp"
  | "verifying"
  | "loading"
  | "error"
  | "tryAgain"
  | "save"
  | "cancel"
  | "delete"
  | "edit"
  | "close"
  | "confirm"
  | "deletePermanently"
  | "deleteDebtTitle"
  | "deleteDebtMessage"
  | "deletePaymentTitle"
  | "deletePaymentMessage"
  | "yes"
  | "no"
  | "home"
  | "debts"
  | "settings"
  | "dashboard"
  | "totalOwedToMe"
  | "totalIOwe"
  | "netBalance"
  | "openDebts"
  | "settledDebts"
  | "recentActivity"
  | "noDebtsYet"
  | "addFirstDebt"
  | "addDebt"
  | "newDebt"
  | "debtDetails"
  | "personName"
  | "personNamePlaceholder"
  | "amount"
  | "amountPlaceholder"
  | "note"
  | "notePlaceholder"
  | "notes"
  | "direction"
  | "owedToMe"
  | "iOwe"
  | "owedToMeShort"
  | "iOweShort"
  | "status"
  | "open"
  | "settled"
  | "remaining"
  | "paid"
  | "of"
  | "createdAt"
  | "updatedAt"
  | "addPayment"
  | "recordPayment"
  | "paymentAmount"
  | "paymentHistory"
  | "noPayments"
  | "all"
  | "filterAll"
  | "filterOpen"
  | "filterSettled"
  | "language"
  | "currency"
  | "selectLanguage"
  | "selectCurrency"
  | "english"
  | "arabic"
  | "account"
  | "preferences"
  | "appInfo"
  | "version"
  | "chooseCurrencyTitle"
  | "chooseCurrencySubtitle"
  | "continue"
  | "you"
  | "searchPerson"
  | "fullySettled"
  | "today"
  | "yesterday"
  | "owesYou"
  | "youOwe"
  | "deletedSuccessfully"
  | "savedSuccessfully"
  | "addedSuccessfully"
  | "passwordTooShort"
  | "invalidEmail"
  | "fillAllFields";

type Translations = Record<TranslationKey, string>;

const en: Translations = {
  appName: "Diyoun",
  tagline: "Track every debt with confidence",
  welcome: "Welcome back",
  signIn: "Sign in",
  signUp: "Create account",
  signOut: "Sign out",
  continueWithGoogle: "Continue with Google",
  or: "or",
  email: "Email",
  password: "Password",
  verificationCode: "Verification code",
  verifyEmail: "Verify your email",
  weSentCode: "We sent a 6-digit code to your email",
  verify: "Verify",
  alreadyHaveAccount: "Already have an account?",
  noAccount: "Don't have an account?",
  createAccount: "Create account",
  signingIn: "Signing in...",
  signingUp: "Creating account...",
  verifying: "Verifying...",
  loading: "Loading",
  error: "Something went wrong",
  tryAgain: "Try again",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  edit: "Edit",
  close: "Close",
  confirm: "Confirm",
  deletePermanently: "Delete permanently",
  deleteDebtTitle: "Delete this debt?",
  deleteDebtMessage:
    "This will permanently remove the debt and all its payments. This cannot be undone.",
  deletePaymentTitle: "Delete this payment?",
  deletePaymentMessage:
    "This payment will be permanently removed from history.",
  yes: "Yes",
  no: "No",
  home: "Home",
  debts: "Debts",
  settings: "Settings",
  dashboard: "Dashboard",
  totalOwedToMe: "Owed to you",
  totalIOwe: "You owe",
  netBalance: "Net balance",
  openDebts: "Open debts",
  settledDebts: "Settled",
  recentActivity: "Recent activity",
  noDebtsYet: "No debts yet",
  addFirstDebt: "Tap the + button to record your first debt.",
  addDebt: "Add debt",
  newDebt: "New debt",
  debtDetails: "Debt details",
  personName: "Person",
  personNamePlaceholder: "Who is it with?",
  amount: "Amount",
  amountPlaceholder: "0.00",
  note: "Note",
  notePlaceholder: "Add a note (optional)",
  notes: "Notes",
  direction: "Type",
  owedToMe: "They owe me",
  iOwe: "I owe",
  owedToMeShort: "Owed to me",
  iOweShort: "I owe",
  status: "Status",
  open: "Open",
  settled: "Settled",
  remaining: "Remaining",
  paid: "Paid",
  of: "of",
  createdAt: "Created",
  updatedAt: "Updated",
  addPayment: "Add payment",
  recordPayment: "Record payment",
  paymentAmount: "Payment amount",
  paymentHistory: "Payment history",
  noPayments: "No payments recorded yet.",
  all: "All",
  filterAll: "All",
  filterOpen: "Open",
  filterSettled: "Settled",
  language: "Language",
  currency: "Currency",
  selectLanguage: "Select language",
  selectCurrency: "Select currency",
  english: "English",
  arabic: "العربية",
  account: "Account",
  preferences: "Preferences",
  appInfo: "App info",
  version: "Version",
  chooseCurrencyTitle: "Choose your currency",
  chooseCurrencySubtitle:
    "All debts will be tracked in this currency. You can change it later in Settings.",
  continue: "Continue",
  you: "You",
  searchPerson: "Search by name",
  fullySettled: "Fully settled",
  today: "Today",
  yesterday: "Yesterday",
  owesYou: "owes you",
  youOwe: "you owe",
  deletedSuccessfully: "Deleted successfully",
  savedSuccessfully: "Saved",
  addedSuccessfully: "Added",
  passwordTooShort: "Password must be at least 8 characters",
  invalidEmail: "Please enter a valid email",
  fillAllFields: "Please fill all required fields",
};

const ar: Translations = {
  appName: "ديون",
  tagline: "تتبع كل دين بثقة",
  welcome: "مرحباً بعودتك",
  signIn: "تسجيل الدخول",
  signUp: "إنشاء حساب",
  signOut: "تسجيل الخروج",
  continueWithGoogle: "المتابعة باستخدام جوجل",
  or: "أو",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  verificationCode: "رمز التحقق",
  verifyEmail: "تحقق من بريدك الإلكتروني",
  weSentCode: "أرسلنا رمزاً مكوناً من 6 أرقام إلى بريدك",
  verify: "تحقق",
  alreadyHaveAccount: "لديك حساب بالفعل؟",
  noAccount: "ليس لديك حساب؟",
  createAccount: "إنشاء حساب",
  signingIn: "جارٍ تسجيل الدخول...",
  signingUp: "جارٍ إنشاء الحساب...",
  verifying: "جارٍ التحقق...",
  loading: "جارٍ التحميل",
  error: "حدث خطأ ما",
  tryAgain: "حاول مرة أخرى",
  save: "حفظ",
  cancel: "إلغاء",
  delete: "حذف",
  edit: "تعديل",
  close: "إغلاق",
  confirm: "تأكيد",
  deletePermanently: "حذف نهائي",
  deleteDebtTitle: "حذف هذا الدين؟",
  deleteDebtMessage:
    "سيتم حذف الدين وجميع الدفعات المرتبطة به نهائياً. لا يمكن التراجع عن هذا الإجراء.",
  deletePaymentTitle: "حذف هذه الدفعة؟",
  deletePaymentMessage: "سيتم حذف هذه الدفعة نهائياً من السجل.",
  yes: "نعم",
  no: "لا",
  home: "الرئيسية",
  debts: "الديون",
  settings: "الإعدادات",
  dashboard: "اللوحة الرئيسية",
  totalOwedToMe: "مستحق لك",
  totalIOwe: "عليك",
  netBalance: "الرصيد الصافي",
  openDebts: "ديون مفتوحة",
  settledDebts: "مسددة",
  recentActivity: "أحدث النشاطات",
  noDebtsYet: "لا توجد ديون حتى الآن",
  addFirstDebt: "اضغط على زر + لإضافة أول دين.",
  addDebt: "إضافة دين",
  newDebt: "دين جديد",
  debtDetails: "تفاصيل الدين",
  personName: "الشخص",
  personNamePlaceholder: "مع من هذا الدين؟",
  amount: "المبلغ",
  amountPlaceholder: "0.00",
  note: "ملاحظة",
  notePlaceholder: "أضف ملاحظة (اختياري)",
  notes: "الملاحظات",
  direction: "النوع",
  owedToMe: "لي عليه",
  iOwe: "علي له",
  owedToMeShort: "لي",
  iOweShort: "علي",
  status: "الحالة",
  open: "مفتوح",
  settled: "مسدد",
  remaining: "المتبقي",
  paid: "المدفوع",
  of: "من",
  createdAt: "تاريخ الإضافة",
  updatedAt: "آخر تحديث",
  addPayment: "إضافة دفعة",
  recordPayment: "تسجيل دفعة",
  paymentAmount: "مبلغ الدفعة",
  paymentHistory: "سجل الدفعات",
  noPayments: "لم يتم تسجيل أي دفعات بعد.",
  all: "الكل",
  filterAll: "الكل",
  filterOpen: "مفتوحة",
  filterSettled: "مسددة",
  language: "اللغة",
  currency: "العملة",
  selectLanguage: "اختر اللغة",
  selectCurrency: "اختر العملة",
  english: "English",
  arabic: "العربية",
  account: "الحساب",
  preferences: "التفضيلات",
  appInfo: "معلومات التطبيق",
  version: "الإصدار",
  chooseCurrencyTitle: "اختر عملتك",
  chooseCurrencySubtitle:
    "سيتم تتبع جميع الديون بهذه العملة. يمكنك تغييرها لاحقاً من الإعدادات.",
  continue: "متابعة",
  you: "أنت",
  searchPerson: "ابحث بالاسم",
  fullySettled: "تم السداد بالكامل",
  today: "اليوم",
  yesterday: "أمس",
  owesYou: "عليه لك",
  youOwe: "عليك له",
  deletedSuccessfully: "تم الحذف بنجاح",
  savedSuccessfully: "تم الحفظ",
  addedSuccessfully: "تمت الإضافة",
  passwordTooShort: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
  invalidEmail: "يرجى إدخال بريد إلكتروني صحيح",
  fillAllFields: "يرجى تعبئة جميع الحقول المطلوبة",
};

export const translations: Record<Language, Translations> = { en, ar };

export function isRTL(lang: Language): boolean {
  return lang === "ar";
}
