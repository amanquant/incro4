// src/components/RibbonNav.tsx

'use client';

import React from 'react';
import styles from './RibbonNav.module.css';

interface NavTab {
  id: string;
  label: string;
  icon: string;
}

interface RibbonNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs?: NavTab[];
}

const defaultTabs: NavTab[] = [
  { id: 'onboarding', label: 'Onboarding', icon: '🚀' },
  { id: 'company-analysis', label: 'Company Analysis', icon: '📊' },
  { id: 'search-deals', label: 'Search Deals', icon: '🔍' },
  { id: 'monitor', label: 'Monitor', icon: '📈' },
];

export const RibbonNav: React.FC<RibbonNavProps> = ({
  activeTab,
  onTabChange,
  tabs = defaultTabs,
}) => {
  return (
    <nav className={styles.ribbon}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>💼</span>
          <span className={styles.logoText}>Incrolink</span>
        </div>

        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${
                activeTab === tab.id ? styles.active : ''
              }`}
              onClick={() => onTabChange(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className={styles.icon}>{tab.icon}</span>
              <span className={styles.label}>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.status}>
          <span className={styles.badge}>v1.0</span>
        </div>
      </div>
    </nav>
  );
};

export default RibbonNav;
