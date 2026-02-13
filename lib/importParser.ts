import * as XLSX from "xlsx";
import { EmailStatus, ImportRow, ImportValidation } from "@/types";

interface ParseImportResult {
  rows: ImportRow[];
  validations: ImportValidation[];
  totalRawRows: number;
  filteredOutRows: number;
}

const TREATED_COLUMNS = [
  "company",
  "email",
  "region",
  "industry",
  "keywords",
  "status",
  "campaign_name",
  "user_id",
  "lead_name",
  "phone",
  "city",
  "state",
  "address",
  "google_maps_url",
  "lead_category",
];

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "real estate": ["property management", "real estate investing"],
  construction: ["general contracting", "building services"],
  healthcare: ["medical services", "health solutions"],
  technology: ["software solutions", "IT services"],
  finance: ["financial services", "wealth management"],
  legal: ["legal services", "law practice"],
  marketing: ["digital marketing", "brand strategy"],
  education: ["educational services", "learning solutions"],
  retail: ["retail operations", "consumer products"],
  manufacturing: ["industrial manufacturing", "production solutions"],
  hospitality: ["hospitality services", "hotel management"],
  automotive: ["auto services", "vehicle solutions"],
  "food & beverage": ["food services", "restaurant management"],
  insurance: ["insurance services", "risk management"],
  consulting: ["business consulting", "strategy consulting"],
  plumber: ["plumbing services", "drain specialists"],
  plumbing: ["plumbing services", "drain specialists"],
  electrician: ["electrical services", "wiring specialists"],
  electrical: ["electrical services", "wiring specialists"],
  hvac: ["HVAC services", "climate control"],
  roofing: ["roofing services", "roof repair"],
  landscaping: ["landscaping services", "lawn care"],
  painting: ["painting services", "surface finishing"],
  cleaning: ["cleaning services", "janitorial solutions"],
  accounting: ["accounting services", "bookkeeping solutions"],
  dental: ["dental care", "oral health services"],
  veterinary: ["veterinary care", "animal health"],
  photography: ["photography services", "visual content"],
  fitness: ["fitness training", "wellness programs"],
  salon: ["salon services", "beauty treatments"],
  spa: ["spa services", "wellness treatments"],
  restaurant: ["restaurant management", "food services"],
  logistics: ["logistics services", "supply chain"],
  transportation: ["transport services", "freight solutions"],
  architecture: ["architectural design", "building design"],
  engineering: ["engineering services", "technical solutions"],
  pharmacy: ["pharmacy services", "pharmaceutical care"],
  staffing: ["staffing solutions", "recruitment services"],
  security: ["security services", "protection solutions"],
  "pest control": ["pest control", "extermination services"],
  "auto repair": ["auto repair", "vehicle maintenance"],
  "car wash": ["car wash services", "auto detailing"],
  "dry cleaning": ["dry cleaning", "garment care"],
  lawyer: ["law firms", "legal offices"],
  attorney: ["law firms", "legal offices"],
  "law firm": ["law firms", "legal offices"],
  contractor: ["contracting services", "building solutions"],
  builder: ["home building", "construction services"],
  remodeling: ["remodeling services", "home renovation"],
  flooring: ["flooring services", "floor installation"],
  fencing: ["fencing services", "fence installation"],
  tree: ["tree services", "arborist solutions"],
  moving: ["moving services", "relocation solutions"],
  storage: ["storage solutions", "warehousing services"],
  printing: ["printing services", "print solutions"],
  signage: ["signage solutions", "sign manufacturing"],
  "web design": ["web design", "website development"],
  "software development": ["custom software", "app development"],
  it: ["IT support", "tech solutions"],
  "home services": ["home maintenance", "residential services"],
  "property management": ["property management", "rental services"],
  mortgage: ["mortgage lending", "home financing"],
  "title company": ["title services", "escrow solutions"],
  "home inspection": ["home inspection", "property assessment"],
  appraisal: ["appraisal services", "property valuation"],
};

function sanitizeValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (
    lower === "nan" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "#n/a" ||
    lower === "n/a"
  )
    return "";
  return str;
}

function parseKeywords(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  const str = sanitizeValue(val);
  if (!str) return ["general services", "business solutions"];
  try {
    const parsed = JSON.parse(str.replace(/'/g, '"'));
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // not JSON
  }
  const cleaned = str.replace(/[\[\]"']/g, "");
  const parts = cleaned
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts[1]];
  if (parts.length === 1) return [parts[0], "business solutions"];
  return ["general services", "business solutions"];
}

function extractDomain(rawUrl: string): string {
  if (!rawUrl) return "";

  const urlMatch = rawUrl.match(/https?:\/\/[^\s\])"',]+/i);
  const urlCandidate = urlMatch ? urlMatch[0] : rawUrl.trim();

  try {
    let cleaned = urlCandidate;
    if (!cleaned.match(/^https?:\/\//i)) {
      cleaned = "https://" + cleaned;
    }
    const hostname = new URL(cleaned).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    const domainMatch = urlCandidate.match(/(?:[\w-]+\.)+[\w-]+/);
    return domainMatch ? domainMatch[0].replace(/^www\./, "") : "";
  }
}

function generateKeywords(industry: string): string[] {
  if (!industry) return ["general services", "business solutions"];

  const lowerIndustry = industry.toLowerCase().trim();

  for (const [key, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (lowerIndustry === key || lowerIndustry.includes(key) || key.includes(lowerIndustry)) {
      return keywords;
    }
  }

  const words = industry.split(/[\s,&/]+/).filter(Boolean);
  if (words.length >= 2) {
    return [`${words[0].toLowerCase()} services`, `${words[1].toLowerCase()} solutions`];
  }

  return [`${industry.toLowerCase()} services`, `${industry.toLowerCase()} solutions`];
}

function buildGoogleMapsUrl(address: string, city: string, state: string): string {
  const parts = [address, city, state].filter(Boolean);
  if (parts.length === 0) return "";
  const query = parts.join(", ").replace(/\s+/g, "+").replace(/,/g, "%2C");
  return `https://www.google.com/maps/search/${query}`;
}

function findColumnValue(raw: Record<string, unknown>, targetKey: string): unknown {
  const normalizedTarget = targetKey.toLowerCase().trim();
  for (const key of Object.keys(raw)) {
    if (key.toLowerCase().trim() === normalizedTarget) {
      return raw[key];
    }
  }
  return undefined;
}

function detectFormat(rawData: Record<string, unknown>[]): "treated" | "raw" {
  if (rawData.length === 0) return "raw";
  const headers = Object.keys(rawData[0]).map((h) => h.toLowerCase().trim());
  const matchCount = TREATED_COLUMNS.filter((col) => headers.includes(col)).length;
  return matchCount >= 10 ? "treated" : "raw";
}

function processTreatedData(rawData: Record<string, unknown>[]): ParseImportResult {
  const totalRawRows = rawData.length;
  const rows: ImportRow[] = [];
  const validations: ImportValidation[] = [];
  let filteredOutRows = 0;

  rawData.forEach((raw) => {
    const company = sanitizeValue(findColumnValue(raw, "company"));
    const email = sanitizeValue(findColumnValue(raw, "email"));

    if (!company && !email) {
      filteredOutRows++;
      return;
    }

    if (!email) {
      validations.push({
        rowIndex: rows.length,
        field: "email",
        message: "Email is empty",
        severity: "warning",
      });
    }

    if (!company) {
      validations.push({
        rowIndex: rows.length,
        field: "company",
        message: "Company is empty",
        severity: "warning",
      });
    }

    const leadName = sanitizeValue(findColumnValue(raw, "lead_name"));
    if (!leadName) {
      validations.push({
        rowIndex: rows.length,
        field: "lead_name",
        message: "Lead name is empty",
        severity: "warning",
      });
    }

    const keywords = parseKeywords(findColumnValue(raw, "keywords"));

    rows.push({
      company,
      email,
      region: sanitizeValue(findColumnValue(raw, "region")) || "Utah",
      industry: sanitizeValue(findColumnValue(raw, "industry")),
      keywords,
      status: (sanitizeValue(findColumnValue(raw, "status")) || "researched") as EmailStatus,
      campaign_name: sanitizeValue(findColumnValue(raw, "campaign_name")),
      lead_name: leadName,
      phone: sanitizeValue(findColumnValue(raw, "phone")),
      city: sanitizeValue(findColumnValue(raw, "city")),
      state: sanitizeValue(findColumnValue(raw, "state")),
      address: sanitizeValue(findColumnValue(raw, "address")),
      google_maps_url: sanitizeValue(findColumnValue(raw, "google_maps_url")),
      lead_category: sanitizeValue(findColumnValue(raw, "lead_category")),
    });
  });

  return { rows, validations, totalRawRows, filteredOutRows };
}

function mapRawRow(
  raw: Record<string, unknown>,
  index: number,
): { row: ImportRow; validations: ImportValidation[] } {
  const validations: ImportValidation[] = [];

  const normalizedUrl = sanitizeValue(findColumnValue(raw, "Normalized URL"));
  const company = extractDomain(normalizedUrl);

  if (!company) {
    validations.push({
      rowIndex: index,
      field: "company",
      message: "Could not extract domain from Normalized URL",
      severity: "warning",
    });
  }

  const workEmail = sanitizeValue(findColumnValue(raw, "Use Work Email"));
  const fallbackEmail = sanitizeValue(findColumnValue(raw, "Email"));
  const email = workEmail || fallbackEmail;

  if (!email) {
    validations.push({
      rowIndex: index,
      field: "email",
      message: "No email found (checked Use Work Email and Email columns)",
      severity: "warning",
    });
  }

  const industry = sanitizeValue(findColumnValue(raw, "Industry"));
  const keywords = generateKeywords(industry);
  const leadName = sanitizeValue(findColumnValue(raw, "Full Name"));
  const phone = sanitizeValue(findColumnValue(raw, "Use Phone Number"));
  const city = sanitizeValue(findColumnValue(raw, "Use City"));
  const state = sanitizeValue(findColumnValue(raw, "Use State"));
  const address = sanitizeValue(findColumnValue(raw, "Use Address"));
  const googleMapsUrl = buildGoogleMapsUrl(address, city, state);

  if (!leadName) {
    validations.push({
      rowIndex: index,
      field: "lead_name",
      message: "Lead name is empty",
      severity: "warning",
    });
  }

  const row: ImportRow = {
    company,
    email,
    region: "Utah",
    industry,
    keywords,
    status: "researched" as EmailStatus,
    campaign_name: "",
    lead_name: leadName,
    phone,
    city,
    state,
    address,
    google_maps_url: googleMapsUrl,
    lead_category: industry,
  };

  return { row, validations };
}

function processRawData(rawData: Record<string, unknown>[]): ParseImportResult {
  const totalRawRows = rawData.length;

  const withCompany = rawData.filter((row) => {
    const companyName = sanitizeValue(findColumnValue(row, "Company Name"));
    return companyName.length > 0;
  });

  const filteredOutRows = totalRawRows - withCompany.length;
  const rows: ImportRow[] = [];
  const validations: ImportValidation[] = [];

  withCompany.forEach((raw, index) => {
    const result = mapRawRow(raw, index);
    rows.push(result.row);
    validations.push(...result.validations);
  });

  return { rows, validations, totalRawRows, filteredOutRows };
}

export function parseImportFile(file: File): Promise<ParseImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

        const format = detectFormat(rawData);
        const result = format === "treated" ? processTreatedData(rawData) : processRawData(rawData);
        resolve(result);
      } catch {
        reject(new Error("Failed to parse file. Ensure it is a valid CSV or XLSX."));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}
