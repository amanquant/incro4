// src/hooks/useCompanySearch.ts

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { Company, ApiResponse } from "@/lib/api/types";

interface UseCompanySearchReturn {
  results: Company[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

export function useCompanySearch(): UseCompanySearchReturn {
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<ApiResponse<Company[]>>(
        "/search/companies",
        { query, limit: 20 }
      );

      if (response.status === "success" && response.data) {
        setResults(response.data);
      } else {
        setError("No companies found");
        setResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}
