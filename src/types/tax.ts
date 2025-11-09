export interface TaxSlab {
  upTo: number;
  rate: number;
}

export interface TaxSlabDocument {
  _id?: string;
  assessmentYear: string; // e.g., "2024-25"
  regime: 'new' | 'old';
  slabs: TaxSlab[];
  standardDeduction: number;
  cessRate: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AssessmentYear {
  year: string;
  label: string;
}
