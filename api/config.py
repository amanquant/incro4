# api/config.py
"""
Environment configuration and Supabase client setup
Replace Dropbox credentials with Supabase credentials
"""

import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

# ============================================================================
# SUPABASE CONFIGURATION (replaces DROPBOX config)
# ============================================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")  # anon key
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # service role (for admin ops)

# Verify credentials
if not SUPABASE_URL or not SUPABASE_API_KEY:
    raise ValueError("❌ Missing SUPABASE_URL or SUPABASE_API_KEY in environment")

# ============================================================================
# CONFIGURATION CONSTANTS (UNCHANGED from original)
# ============================================================================

COLUMNS_REQUIRED = [
    "company", "nace", "ebit", "employees", "revenue", "net_income", "capex", "d_and_a",
    "changes_in_wc", "lt_debt", "st_debt", "sh_equity", "capital_equity", "cash", "category_code"
]

COLUMNS_PORTFOLIO = [
    "company", "nace", "ebit", "employees", "net_income", "capex", "d_and_a",
    "changes_in_wc", "lt_debt", "st_debt", "sh_equity", "capital_equity", "cash", "category_code"
]

FINANCIAL_ITEMS = {
    'long_term_debt': 'Long term debt',
    'shareholders_funds': 'Shareholders funds',
    'operating_revenue': 'Operating revenue (Turnover)',
    'cost_of_employees': 'Costs of employees',
    'ebitda': 'EBITDA'
}

PREDICTABILITY_CATEGORIES = {
    "0": "low growth",
    "0,23": "good growth, low sell side operations",
    "0,43": "good financials and sector conditions, but Management too young",
    "0,54": "good company and sector conditions, but revenue is too small",
    "0,65": "optimal conditions, but margins are weak",
    "0,8": "optimal conditions"
}

# ============================================================================
# TABLE NAMES in Supabase (normalized from Excel sheets)
# ============================================================================

TABLES = {
    "dataset": "companies_dataset",           # Main dataset
    "wacc": "sector_wacc_map",                # WACC parameters by sector
    "portfolio": "portfolio_companies",       # Portfolio companies
    "financial_statements": "financial_data", # Financial statements (time series)
    "contacts": "contacts",                   # Contact network
}

# ============================================================================
# VERCEL DEPLOYMENT CONFIG
# ============================================================================

VERCEL_ENV = os.getenv("VERCEL_ENV", "development")  # development, preview, production
MAX_REQUEST_DURATION = 25  # Vercel free tier max: 26 seconds

# ============================================================================
# API SETTINGS
# ============================================================================

API_PREFIX = "/api/v1"
CACHE_TTL = 3600  # Cache responses for 1 hour


class Config:
    """Configuration object for the application"""
    
    def __init__(self):
        self.supabase_url = SUPABASE_URL
        self.supabase_key = SUPABASE_API_KEY
        self.vercel_env = VERCEL_ENV
        self.api_prefix = API_PREFIX
        self.cache_ttl = CACHE_TTL
    
    @property
    def is_production(self) -> bool:
        return self.vercel_env == "production"
    
    @property
    def is_development(self) -> bool:
        return self.vercel_env == "development"
    
    def get_log_level(self) -> str:
        return "WARNING" if self.is_production else "DEBUG"


config = Config()
