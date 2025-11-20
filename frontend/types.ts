// src/lib/api/types.ts

export interface Company {
  id?: string;
  company: string;
  nace?: string;
  ebit?: number;
  employees?: number;
  revenue?: number;
  net_income?: number;
  capex?: number;
  d_and_a?: number;
  changes_in_wc?: number;
  lt_debt?: number;
  st_debt?: number;
  sh_equity?: number;
  capital_equity?: number;
  cash?: number;
  category_code?: string;
}

export interface Frame1Result {
  company_name: string;
  category_code: string;
  metrics: {
    ltde: number | null;
    edamargin: number | null;
    fx: number | null;
  };
  sector_percentiles: {
    ltde: PercentileData;
    edamargin: PercentileData;
    fx: PercentileData;
  };
  positions: {
    [key: string]: {
      position: string;
      rank: string;
      range: string;
    };
  };
}

export interface Frame2Result {
  company_name: string;
  EV_current: number;
  EV_DCF: number;
  growth_expected: number;
  classification: string;
  parameters: {
    Re: number | null;
    Rd: number | null;
    WACC: number | null;
    g: number | null;
  };
  FCF0: number;
  Terminal_Value: number;
}

export interface Frame3Result {
  company_name: string;
  leaf_value: string;
  category: string;
  decision_path: string[];
}

export interface PercentileData {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  count?: number;
  error?: string;
}

export interface SearchResult {
  data: Company[];
  count: number;
}

export interface AnalysisState {
  company: Company | null;
  frame1: Frame1Result | null;
  frame2: Frame2Result | null;
  frame3: Frame3Result | null;
  loading: {
    frame1: boolean;
    frame2: boolean;
    frame3: boolean;
  };
  error: {
    frame1: string | null;
    frame2: string | null;
    frame3: string | null;
  };
}
