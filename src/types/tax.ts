export interface TaxSlab {
  upTo: number;
  rate: number;
}

export interface Rebate {
  amount: number; // Maximum rebate cap for the year
  incomeThreshold: number; // Income threshold for eligibility (cliff rule)
}

export interface TaxSlabDocument {
  _id?: string;
  assessmentYear: string; // e.g., "2024-25"
  regime: 'new' | 'old';
  slabs: TaxSlab[];
  standardDeduction: number;
  cessRate: number;
  rebate?: Rebate;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssessmentYear {
  year: string;
  label: string;
}
