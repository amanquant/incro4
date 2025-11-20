// src/components/CompanyAnalysis/CompanySearch.tsx

'use client';

import React, { useState, useCallback } from 'react';
import { Company } from '@/lib/api/types';
import styles from './CompanySearch.module.css';

interface CompanySearchProps {
  results: Company[];
  loading: boolean;
  error: string | null;
  onSearch: (query: string) => Promise<void>;
  onSelect: (company: Company) => void;
}

export const CompanySearch: React.FC<CompanySearchProps> = ({
  results,
  loading,
  error,
  onSearch,
  onSelect,
}) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await onSearch(query);
      setShowResults(true);
    }
  };

  const handleSelectCompany = (company: Company) => {
    onSelect(company);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder="Search company name..."
            value={query}
            onChange={handleInputChange}
            className={styles.input}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={styles.button}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div className={styles.error}>❌ {error}</div>}

      {showResults && results.length > 0 && (
        <div className={styles.resultsContainer}>
          <h3>Found {results.length} company(ies):</h3>
          <div className={styles.resultsList}>
            {results.map((company, idx) => (
              <div
                key={idx}
                className={styles.resultItem}
                onClick={() => handleSelectCompany(company)}
              >
                <div className={styles.resultName}>{company.company}</div>
                {company.nace && (
                  <div className={styles.resultCategory}>{company.nace}</div>
                )}
                {company.revenue && (
                  <div className={styles.resultRevenue}>
                    Revenue: €{(company.revenue / 1000000).toFixed(1)}M
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showResults && results.length === 0 && !loading && (
        <div className={styles.noResults}>No companies found. Try another search.</div>
      )}
    </div>
  );
};

export default CompanySearch;
