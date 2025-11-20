// src/hooks/useAnalysis.ts

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import {
  Company,
  Frame1Result,
  Frame2Result,
  Frame3Result,
  ApiResponse,
  AnalysisState,
} from "@/lib/api/types";

interface UseAnalysisReturn extends AnalysisState {
  runAnalysis: (company: Company) => Promise<void>;
  resetAnalysis: () => void;
}

const initialState: AnalysisState = {
  company: null,
  frame1: null,
  frame2: null,
  frame3: null,
  loading: { frame1: false, frame2: false, frame3: false },
  error: { frame1: null, frame2: null, frame3: null },
};

export function useAnalysis(): UseAnalysisReturn {
  const [state, setState] = useState<AnalysisState>(initialState);

  const runAnalysis = useCallback(async (company: Company) => {
    setState((prev) => ({
      ...prev,
      company,
      loading: { frame1: true, frame2: true, frame3: true },
      error: { frame1: null, frame2: null, frame3: null },
    }));

    // Run Frame 1 Analysis
    try {
      const frame1Response = await apiClient.post<ApiResponse<Frame1Result>>(
        "/analysis/frame1",
        company
      );

      if (frame1Response.status === "success" && frame1Response.data) {
        setState((prev) => ({
          ...prev,
          frame1: frame1Response.data,
          loading: { ...prev.loading, frame1: false },
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: { ...prev.error, frame1: "Frame 1 analysis failed" },
          loading: { ...prev.loading, frame1: false },
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: {
          ...prev.error,
          frame1: err instanceof Error ? err.message : "Frame 1 error",
        },
        loading: { ...prev.loading, frame1: false },
      }));
    }

    // Run Frame 2 Analysis
    try {
      const frame2Response = await apiClient.post<ApiResponse<Frame2Result>>(
        "/analysis/frame2",
        company
      );

      if (frame2Response.status === "success" && frame2Response.data) {
        setState((prev) => ({
          ...prev,
          frame2: frame2Response.data,
          loading: { ...prev.loading, frame2: false },
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: { ...prev.error, frame2: "Frame 2 analysis failed" },
          loading: { ...prev.loading, frame2: false },
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: {
          ...prev.error,
          frame2: err instanceof Error ? err.message : "Frame 2 error",
        },
        loading: { ...prev.loading, frame2: false },
      }));
    }

    // Run Frame 3 Analysis
    try {
      // Prepare data for Frame 3
      const frame2Data = state.frame2 || {};
      const analysisData = {
        company_name: company.company,
        ev_growth: (frame2Data as any)?.growth_expected || 0,
        nsellside: Number.isNaN(company.net_income) ? Number.NaN : company.net_income,
        nsellside_p50: Number.NaN,
        ceo_age: null,
        revenue: company.revenue || Number.NaN,
        edamargin: Number.NaN,
        edamargin_p75: Number.NaN,
      };

      const frame3Response = await apiClient.post<ApiResponse<Frame3Result>>(
        "/analysis/frame3",
        analysisData
      );

      if (frame3Response.status === "success" && frame3Response.data) {
        setState((prev) => ({
          ...prev,
          frame3: frame3Response.data,
          loading: { ...prev.loading, frame3: false },
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: { ...prev.error, frame3: "Frame 3 analysis failed" },
          loading: { ...prev.loading, frame3: false },
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: {
          ...prev.error,
          frame3: err instanceof Error ? err.message : "Frame 3 error",
        },
        loading: { ...prev.loading, frame3: false },
      }));
    }
  }, [state.frame2]);

  const resetAnalysis = useCallback(() => {
    setState(initialState);
  }, []);

  return { ...state, runAnalysis, resetAnalysis };
}
