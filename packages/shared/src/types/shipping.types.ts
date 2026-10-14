export interface ShippingZone {
  _id: string;
  county: string;
  baseFee: number;
  includedGrams: number;
  additionalPerKg: number;
  label?: string;
  etaText?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingQuote {
  county: string;
  zoneId: string | null;
  zoneLabel: string;
  etaText?: string;
  totalWeightGrams: number;
  baseFee: number;
  includedGrams: number;
  additionalGrams: number;
  additionalKg: number;
  additionalFee: number;
  totalFee: number;
  isFallback: boolean;
}