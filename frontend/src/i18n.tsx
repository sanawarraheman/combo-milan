import React, { createContext, useContext, useEffect, useState } from "react";

import { storage } from "@/src/utils/storage";

export type Lang = "en" | "hi";

type Dict = Record<string, string>;

const en: Dict = {
  tagline: "Spare parts compatibility",
  searchPlaceholder: "Search brand, model, part, source…",
  searchResults: "Search results",
  noResults: "No matches found",
  categories: "Categories",
  verified: "Verified",
  unconfirmed: "Unconfirmed",
  confirm: "Confirm",
  suggestCorrection: "Suggest a correction",
  source: "Source",
  addData: "Add data",
  calculator: "Voltage Calc",
  exportExcel: "Export Excel",
  noData: "No compatibility data added yet",
  // admin
  adminAccess: "Admin access",
  enterPasscode: "Enter passcode to add data",
  wrongPasscode: "Incorrect passcode",
  unlock: "Unlock",
  // add data
  addCompatGroup: "Add compatibility group",
  addModel: "Add model",
  category: "Category",
  subCategory: "Sub-category",
  brandGroup: "Brand group",
  models: "Model names (one per line)",
  modelsHint: "One model per line — they'll be joined with =",
  sourceOptional: "Source (optional)",
  status: "Status",
  save: "Save",
  modelName: "Model name",
  brand: "Brand",
  saved: "Saved successfully",
  saveFailed: "Could not save. Try again.",
  // correction
  correctionTitle: "Suggest a correction",
  claimedModels: "Claimed compatible models",
  notes: "Notes (optional)",
  submit: "Submit",
  submitted: "Submitted for review",
  // calculator
  voltageDivider: "Voltage Divider Calculator",
  vin: "Input voltage (Vin)",
  r1: "R1 (Ω)",
  r2: "R2 (Ω)",
  vout: "Output voltage (Vout)",
  formula: "Vout = Vin × R2 / (R1 + R2)",
  close: "Close",
  groupsLabel: "groups",
  verifiedLabel: "verified",
  confirmsLabel: "confirms",
  modelsShort: "models",
  exported: "Exported — choose where to share",
  nothingToExport: "No data to export yet",
  required: "This field is required",
  basic: "Basic",
  advanced: "Advanced",
  normalGlass: "Normal Glass",
  numResistors: "Number of resistors",
  resistorLabel: "Resistor",
  dropsLabel: "Voltage drops",
  totalResistance: "Total resistance",
  circuitCurrent: "Circuit current",
  // review panel
  reviewTitle: "Review corrections",
  pendingLabel: "Pending",
  approvedLabel: "Approved",
  rejectedLabel: "Rejected",
  approve: "Approve",
  reject: "Reject",
  noSubmissions: "No submissions here",
  claimedLabel: "Claimed",
};

const hi: Dict = {
  tagline: "स्पेयर पार्ट्स कम्पैटिबिलिटी",
  searchPlaceholder: "ब्रांड, मॉडल, पार्ट, स्रोत खोजें…",
  searchResults: "खोज परिणाम",
  noResults: "कोई मिलान नहीं मिला",
  categories: "श्रेणियाँ",
  verified: "सत्यापित",
  unconfirmed: "असत्यापित",
  confirm: "पुष्टि करें",
  suggestCorrection: "सुधार सुझाएँ",
  source: "स्रोत",
  addData: "डेटा जोड़ें",
  calculator: "वोल्टेज कैल्क",
  exportExcel: "एक्सेल निर्यात",
  noData: "अभी तक कोई कम्पैटिबिलिटी डेटा नहीं जोड़ा गया",
  adminAccess: "एडमिन एक्सेस",
  enterPasscode: "डेटा जोड़ने के लिए पासकोड दर्ज करें",
  wrongPasscode: "गलत पासकोड",
  unlock: "अनलॉक करें",
  addCompatGroup: "कम्पैटिबिलिटी ग्रुप जोड़ें",
  addModel: "मॉडल जोड़ें",
  category: "श्रेणी",
  subCategory: "उप-श्रेणी",
  brandGroup: "ब्रांड ग्रुप",
  models: "मॉडल नाम (एक प्रति पंक्ति)",
  modelsHint: "एक मॉडल प्रति पंक्ति — इन्हें = से जोड़ा जाएगा",
  sourceOptional: "स्रोत (वैकल्पिक)",
  status: "स्थिति",
  save: "सहेजें",
  modelName: "मॉडल नाम",
  brand: "ब्रांड",
  saved: "सफलतापूर्वक सहेजा गया",
  saveFailed: "सहेजा नहीं जा सका। पुनः प्रयास करें।",
  correctionTitle: "सुधार सुझाएँ",
  claimedModels: "दावा किए गए कम्पैटिबल मॉडल",
  notes: "टिप्पणियाँ (वैकल्पिक)",
  submit: "जमा करें",
  submitted: "समीक्षा के लिए जमा किया गया",
  voltageDivider: "वोल्टेज डिवाइडर कैलकुलेटर",
  vin: "इनपुट वोल्टेज (Vin)",
  r1: "R1 (Ω)",
  r2: "R2 (Ω)",
  vout: "आउटपुट वोल्टेज (Vout)",
  formula: "Vout = Vin × R2 / (R1 + R2)",
  close: "बंद करें",
  groupsLabel: "ग्रुप",
  verifiedLabel: "सत्यापित",
  confirmsLabel: "पुष्टियाँ",
  modelsShort: "मॉडल",
  exported: "निर्यात हुआ — साझा करने का स्थान चुनें",
  nothingToExport: "अभी निर्यात करने के लिए कोई डेटा नहीं",
  required: "यह फ़ील्ड आवश्यक है",
  basic: "बेसिक",
  advanced: "एडवांस्ड",
  normalGlass: "नॉर्मल ग्लास",
  numResistors: "रेजिस्टर की संख्या",
  resistorLabel: "रेजिस्टर",
  dropsLabel: "वोल्टेज ड्रॉप",
  totalResistance: "कुल रेजिस्टेंस",
  circuitCurrent: "सर्किट करंट",
  reviewTitle: "सुधार समीक्षा",
  pendingLabel: "लंबित",
  approvedLabel: "स्वीकृत",
  rejectedLabel: "अस्वीकृत",
  approve: "स्वीकार करें",
  reject: "अस्वीकार करें",
  noSubmissions: "यहाँ कोई सबमिशन नहीं",
  claimedLabel: "दावा",
};

const DICTS: Record<Lang, Dict> = { en, hi };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (k: keyof typeof en) => string;
};

const LanguageContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "combo-milan:lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<Lang>(STORAGE_KEY, "en");
      if (stored === "en" || stored === "hi") setLangState(stored);
    })();
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    storage.setItem(STORAGE_KEY, l);
  };
  const toggle = () => setLang(lang === "en" ? "hi" : "en");
  const t = (k: keyof typeof en) => DICTS[lang][k] ?? DICTS.en[k] ?? String(k);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
