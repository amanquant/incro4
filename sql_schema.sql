# sql/01_init_schema.sql
"""
Supabase database schema - Initialized from Excel data
Run in Supabase SQL Editor to create tables
"""

-- ============================================================================
-- TABLE: companies_dataset (from datasetincro1.xlsx)
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies_dataset (
    id BIGSERIAL PRIMARY KEY,
    company TEXT NOT NULL UNIQUE,
    nace TEXT,
    ebit NUMERIC,
    employees INTEGER,
    revenue NUMERIC,
    net_income NUMERIC,
    capex NUMERIC,
    d_and_a NUMERIC,
    changes_in_wc NUMERIC,
    lt_debt NUMERIC,
    st_debt NUMERIC,
    sh_equity NUMERIC,
    capital_equity NUMERIC,
    cash NUMERIC,
    category_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_category ON companies_dataset(category_code);
CREATE INDEX idx_companies_name ON companies_dataset USING GIN(company gin_trgm_ops);

-- ============================================================================
-- TABLE: sector_wacc_map (from wacc.xlsx)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sector_wacc_map (
    id BIGSERIAL PRIMARY KEY,
    category_code TEXT NOT NULL UNIQUE,
    re NUMERIC,
    rd NUMERIC,
    wacc NUMERIC,
    g NUMERIC,
    -- LTDE percentiles
    ltde10th NUMERIC,
    ltde25th NUMERIC,
    ltde50th NUMERIC,
    ltde75th NUMERIC,
    ltde90th NUMERIC,
    -- EDAMARGIN percentiles
    edamarg10th NUMERIC,
    edamarg25th NUMERIC,
    edamarg50th NUMERIC,
    edamarg75th NUMERIC,
    edamarg90th NUMERIC,
    -- FX percentiles
    fx10th NUMERIC,
    fx25th NUMERIC,
    fx50th NUMERIC,
    fx75th NUMERIC,
    fx90th NUMERIC,
    -- N Sell Side
    nsellside NUMERIC,
    nsellside50th NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wacc_category ON sector_wacc_map(category_code);

-- ============================================================================
-- TABLE: portfolio_companies (from db.xlsx)
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio_companies (
    id BIGSERIAL PRIMARY KEY,
    portfolio_id TEXT,
    company TEXT NOT NULL,
    nace TEXT,
    ebit NUMERIC,
    employees INTEGER,
    net_income NUMERIC,
    capex NUMERIC,
    d_and_a NUMERIC,
    changes_in_wc NUMERIC,
    lt_debt NUMERIC,
    st_debt NUMERIC,
    sh_equity NUMERIC,
    capital_equity NUMERIC,
    cash NUMERIC,
    category_code TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portfolio_company ON portfolio_companies(company);
CREATE INDEX idx_portfolio_id ON portfolio_companies(portfolio_id);

-- ============================================================================
-- TABLE: financial_data (from volkfs.xlsx - time series)
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_data (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies_dataset(id),
    company_name TEXT,
    fiscal_year INTEGER,
    -- Line items from financial statements
    long_term_debt NUMERIC,
    shareholders_funds NUMERIC,
    operating_revenue NUMERIC,
    cost_of_employees NUMERIC,
    ebitda NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_financial_company ON financial_data(company_id);
CREATE INDEX idx_financial_year ON financial_data(fiscal_year);

-- ============================================================================
-- TABLE: contacts (from contacts.xlsx)
-- ============================================================================
CREATE TABLE IF NOT EXISTS contacts (
    id BIGSERIAL PRIMARY KEY,
    contact_id TEXT NOT NULL UNIQUE,
    company_id TEXT,
    company_name TEXT,
    name TEXT,
    role TEXT,
    email TEXT,
    mobile TEXT,
    linkedin TEXT,
    relative TEXT,
    ceo BOOLEAN DEFAULT FALSE,
    age INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_name ON contacts USING GIN(name gin_trgm_ops);
CREATE INDEX idx_contacts_email ON contacts(email);

-- ============================================================================
-- TABLE: analysis_cache (optional - for caching results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS analysis_cache (
    id BIGSERIAL PRIMARY KEY,
    company_id TEXT,
    analysis_type TEXT,
    result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour')
);

CREATE INDEX idx_cache_company_type ON analysis_cache(company_id, analysis_type);

-- ============================================================================
-- ENABLE FULL TEXT SEARCH
-- ============================================================================
ALTER TABLE companies_dataset ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE companies_dataset 
SET search_vector = to_tsvector('english', company || ' ' || COALESCE(nace, ''));

CREATE INDEX idx_companies_search ON companies_dataset USING GIN(search_vector);

-- ============================================================================
-- ROW LEVEL SECURITY (if needed)
-- ============================================================================
ALTER TABLE companies_dataset ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_wacc_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow SELECT for anon users
CREATE POLICY "Allow read access to companies" ON companies_dataset
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to wacc" ON sector_wacc_map
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to contacts" ON contacts
    FOR SELECT USING (true);
