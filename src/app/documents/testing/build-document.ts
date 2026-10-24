import { DocumentDto } from '../models/document.model';
import { ContractData, InvoiceData, ResumeData } from '../models/extracted-data.model';

/** Documento de ejemplo para los tests; se ajusta con `overrides`. */
export function buildDocument(overrides: Partial<DocumentDto> = {}): DocumentDto {
  return {
    id: '3a2465c7-fce3-45f9-ab39-d23b3b407e4f',
    originalName: '1-factura-electronica.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2015,
    status: 'ready',
    pageCount: 1,
    failureReason: null,
    documentType: 'invoice',
    summary: 'Factura de Tecnosuministros por 2.638.825 COP.',
    extractedData: buildInvoiceData(),
    createdAt: '2026-10-24T13:00:00.000Z',
    updatedAt: '2026-10-24T13:00:10.000Z',
    ...overrides,
  };
}

export function buildInvoiceData(overrides: Partial<InvoiceData> = {}): InvoiceData {
  return {
    vendorName: 'Tecnosuministros del Caribe S.A.S.',
    vendorTaxId: '901.234.567-8',
    customerName: null,
    invoiceNumber: 'FEV-2026-00418',
    issueDate: '2026-10-14',
    dueDate: '2026-11-13',
    currency: 'COP',
    subtotal: 2217500,
    tax: 421325,
    total: 2638825,
    lineItems: [
      { description: 'Resma papel carta', quantity: 5, unitPrice: 24500, amount: 122500 },
    ],
    ...overrides,
  };
}

export function buildContractData(): ContractData {
  return {
    title: 'Contrato de prestación de servicios',
    parties: [
      { name: 'Clínica Dental Sonrisas del Sinú S.A.S.', role: 'EL CONTRATANTE' },
      { name: 'Juan David Arrieta Padilla', role: null },
    ],
    effectiveDate: '2026-11-03',
    expirationDate: '2027-02-02',
    value: 8000000,
    currency: 'COP',
    governingLaw: null,
  };
}

export function buildResumeData(): ResumeData {
  return {
    fullName: 'Andrés Felipe Coronado Mercado',
    email: 'andres.coronado@example.com',
    phone: null,
    location: 'Sincelejo, Sucre, Colombia',
    summary: 'Ingeniero de software.',
    skills: ['TypeScript', 'NestJS'],
    experience: [
      { company: 'Innova Digital Ltda.', role: 'Full Stack', startDate: '2024-01', endDate: null },
    ],
    education: [
      { institution: 'Universidad de Sucre', degree: 'Ingeniería de Sistemas', endYear: 2021 },
    ],
  };
}
