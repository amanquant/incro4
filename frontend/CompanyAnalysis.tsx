// src/components/CompanyAnalysis/index.tsx

'use client';

import React, { useState } from 'react';
import { Company } from '@/lib/api/types';
import { useCompanySearch } from '@/hooks/useCompanySearch';
import { useAnalysis } from '@/hooks/useAnalysis';
import CompanySearch from './CompanySearch';
import AnalysisContainer from './AnalysisContainer';
import styles from './CompanyAnalysis.module.css';

export const CompanyAnalysis: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const { results, loading: searching, error: searchError, search } = useCompanySearch();
  const {
    company,
    frame1,
    frame2,
    frame3,
    loading,
    error,
    runAnalysis,
    resetAnalysis,
  } = useAnalysis();

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
  };

  const handleRunAnalysis = async () => {
    if (selectedCompany) {
      await runAnalysis(selectedCompany);
    }
  };

  const handleNewSearch = () => {
    setSelectedCompany(null);
    resetAnalysis();
  };

  return (
    <div className={styles.container}>
      <h1>📊 Company Analysis</h1>
      <p className={styles.description}>
        Search and analyze company financial metrics, valuations, and predictability
      </p>

      {!selectedCompany ? (
        <CompanySearch
          results={results}
          loading={searching}
          error={searchError}
          onSearch={search}
          onSelect={handleCompanySelect}
        />
      ) : (
        <div>
          <div className={styles.selectedCompany}>
            <h2>Selected: {selectedCompany.company}</h2>
            <button onClick={handleNewSearch} className={styles.changeButton}>
              Change Company
            </button>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={loading.frame1 || loading.frame2 || loading.frame3}
            className={styles.analyzeButton}
          >
            {loading.frame1 || loading.frame2 || loading.frame3
              ? 'Running Analysis...'
              : 'Run Full Analysis'}
          </button>

          {(frame1 || frame2 || frame3) && (
            <AnalysisContainer
              company={selectedCompany}
              frame1={frame1}
              frame2={frame2}
              frame3={frame3}
              loading={loading}
              error={error}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyAnalysis;
