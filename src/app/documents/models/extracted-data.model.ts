/** Copia de los esquemas de la API (`src/ai/schemas`); null significa "no está en el documento". */

export interface InvoiceLineItem {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
}

export interface InvoiceData {
  vendorName: string | null;
  vendorTaxId: string | null;
  customerName: string | null;
  invoiceNumber: string | null;
  issueDate: string | null;
  dueDate: string | null;
  currency: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  lineItems: InvoiceLineItem[];
}

export interface ContractParty {
  name: string;
  role: string | null;
}

export interface ContractData {
  title: string | null;
  parties: ContractParty[];
  effectiveDate: string | null;
  expirationDate: string | null;
  value: number | null;
  currency: string | null;
  governingLaw: string | null;
}

export interface WorkExperience {
  company: string;
  role: string | null;
  /** `YYYY-MM` */
  startDate: string | null;
  /** `YYYY-MM`; null también cuando es el trabajo actual. */
  endDate: string | null;
}

export interface Education {
  institution: string;
  degree: string | null;
  endYear: number | null;
}

export interface ResumeData {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
}

export type ExtractedData = InvoiceData | ContractData | ResumeData;
