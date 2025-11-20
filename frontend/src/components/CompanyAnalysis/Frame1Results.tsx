// src/components/Frame1Results.tsx

'use client';

import React from 'react';
import { Frame1Result } from '@/lib/api/types';
import styles from './FrameResults.module.css';

interface Frame1Props {
  data: Frame1Result;
  loading: boolean;
}

export const Frame1Results: React.FC<Frame1Props> = ({ data, loading }) => {
  if (loading) {
    return <div className={styles.loading}>Loading Frame 1 Analysis...</div>;
  }

  if (!data) {
    return null;
  }

  const metrics = data.metrics;
  const positions = data.positions;

  const getRankColor = (rank: string): string => {
    if (rank.includes('Exceptional (Top)')) return '#10b981';
    if (rank.includes('Q4')) return '#3b82f6';
    if (rank.includes('Q3')) return '#f59e0b';
    if (rank.includes('Q2')) return '#ef4444';
    if (rank.includes('Q1')) return '#dc2626';
    return '#6b7280';
  };

  return (
    <div className={styles.container}>
      <h3>📊 Frame 1: Financial Metrics Analysis</h3>

      <div className={styles.metricsGrid}>
        {/* LTDE Metric */}
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>LTDE (Leverage)</div>
          <div className={styles.metricValue}>
            {metrics.ltde !== null ? metrics.ltde.toFixed(4) : 'N/A'}
          </div>
          {positions.ltde && (
            <div className={styles.positionInfo}>
              <span
                className={styles.badge}
                style={{ backgroundColor: getRankColor(positions.ltde.rank) }}
              >
                {positions.ltde.rank}
              </span>
              <div className={styles.range}>{positions.ltde.position}</div>
            </div>
          )}
        </div>

        {/* EDAMARGIN Metric */}
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>EDAMARGIN (Profitability)</div>
          <div className={styles.metricValue}>
            {metrics.edamargin !== null ? (metrics.edamargin * 100).toFixed(2) : 'N/A'}%
          </div>
          {positions.edamargin && (
            <div className={styles.positionInfo}>
              <span
                className={styles.badge}
                style={{ backgroundColor: getRankColor(positions.edamargin.rank) }}
              >
                {positions.edamargin.rank}
              </span>
              <div className={styles.range}>{positions.edamargin.position}</div>
            </div>
          )}
        </div>

        {/* FX Metric */}
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>FX (Labor Cost)</div>
          <div className={styles.metricValue}>
            {metrics.fx !== null ? metrics.fx.toFixed(4) : 'N/A'}
          </div>
          {positions.fx && (
            <div className={styles.positionInfo}>
              <span
                className={styles.badge}
                style={{ backgroundColor: getRankColor(positions.fx.rank) }}
              >
                {positions.fx.rank}
              </span>
              <div className={styles.range}>{positions.fx.position}</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.sectorInfo}>
        <h4>Sector Benchmarks (P10 | P25 | P50 | P75 | P90)</h4>
        <div className={styles.benchmarkRow}>
          <span className={styles.label}>LTDE:</span>
          <span className={styles.values}>{data.sector_percentiles.ltde?.p10?.toFixed(4) || 'N/A'} | {data.sector_percentiles.ltde?.p25?.toFixed(4) || 'N/A'} | {data.sector_percentiles.ltde?.p50?.toFixed(4) || 'N/A'} | {data.sector_percentiles.ltde?.p75?.toFixed(4) || 'N/A'} | {data.sector_percentiles.ltde?.p90?.toFixed(4) || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default Frame1Results;
