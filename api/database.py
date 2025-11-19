# api/database.py
"""
Supabase database connection and query helper functions
Replaces Dropbox file streaming with SQL queries
"""

import asyncio
from typing import List, Dict, Optional
import pandas as pd
from supabase import create_client, Client
from postgrest.exceptions import APIError
import logging

from .config import SUPABASE_URL, SUPABASE_API_KEY, TABLES

logger = logging.getLogger(__name__)

# ============================================================================
# SUPABASE CLIENT INITIALIZATION
# ============================================================================

class SupabaseDB:
    """Singleton Supabase database connection"""
    
    _instance = None
    _client: Optional[Client] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseDB, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._client is None:
            try:
                self._client = create_client(SUPABASE_URL, SUPABASE_API_KEY)
                logger.info("✅ Supabase client initialized")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Supabase: {str(e)}")
                raise
    
    @property
    def client(self) -> Client:
        if self._client is None:
            raise RuntimeError("Supabase client not initialized")
        return self._client
    
    async def health_check(self) -> bool:
        """Test connection to Supabase"""
        try:
            response = await asyncio.to_thread(
                lambda: self.client.table(TABLES["dataset"]).select("count", count="exact").limit(1).execute()
            )
            return True
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return False


# Initialize singleton
supabase_db = SupabaseDB()


# ============================================================================
# DATA LOADING FUNCTIONS (Supabase replaces Dropbox streaming)
# ============================================================================

async def load_dataset() -> Optional[pd.DataFrame]:
    """Load companies dataset from Supabase"""
    try:
        response = await asyncio.to_thread(
            lambda: supabase_db.client.table(TABLES["dataset"]).select("*").execute()
        )
        df = pd.DataFrame(response.data)
        logger.info(f"✅ Loaded {len(df)} companies from dataset")
        return df
    except APIError as e:
        logger.error(f"❌ Failed to load dataset: {str(e)}")
        return None


async def load_wacc_map() -> Optional[pd.DataFrame]:
    """Load WACC parameters by sector"""
    try:
        response = await asyncio.to_thread(
            lambda: supabase_db.client.table(TABLES["wacc"]).select("*").execute()
        )
        df = pd.DataFrame(response.data)
        logger.info(f"✅ Loaded WACC data for {len(df)} sectors")
        return df
    except APIError as e:
        logger.error(f"❌ Failed to load WACC map: {str(e)}")
        return None


async def load_portfolio(portfolio_id: Optional[str] = None) -> Optional[pd.DataFrame]:
    """Load portfolio companies. If portfolio_id provided, load specific portfolio"""
    try:
        query = supabase_db.client.table(TABLES["portfolio"]).select("*")
        
        if portfolio_id:
            query = query.eq("portfolio_id", portfolio_id)
        
        response = await asyncio.to_thread(lambda: query.execute())
        df = pd.DataFrame(response.data)
        logger.info(f"✅ Loaded {len(df)} portfolio companies")
        return df
    except APIError as e:
        logger.error(f"❌ Failed to load portfolio: {str(e)}")
        return None


async def load_financial_statements(company_id: str) -> Optional[pd.DataFrame]:
    """Load financial statements time series for a company"""
    try:
        response = await asyncio.to_thread(
            lambda: supabase_db.client.table(TABLES["financial_statements"])
            .select("*")
            .eq("company_id", company_id)
            .order("fiscal_year", desc=True)
            .execute()
        )
        df = pd.DataFrame(response.data)
        logger.info(f"✅ Loaded {len(df)} financial statements for company {company_id}")
        return df
    except APIError as e:
        logger.error(f"❌ Failed to load financial statements: {str(e)}")
        return None


async def load_contacts(company_id: Optional[str] = None) -> Optional[pd.DataFrame]:
    """Load contacts, optionally filtered by company"""
    try:
        query = supabase_db.client.table(TABLES["contacts"]).select("*")
        
        if company_id:
            query = query.eq("company_id", company_id)
        
        response = await asyncio.to_thread(lambda: query.execute())
        df = pd.DataFrame(response.data)
        logger.info(f"✅ Loaded {len(df)} contacts")
        return df
    except APIError as e:
        logger.error(f"❌ Failed to load contacts: {str(e)}")
        return None


# ============================================================================
# BATCH DATA LOADING (optimized for API)
# ============================================================================

async def load_all_data() -> Dict[str, Optional[pd.DataFrame]]:
    """Load all required data in parallel"""
    tasks = [
        load_dataset(),
        load_wacc_map(),
        load_portfolio(),
        load_contacts()
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    data_dict = {
        'dataset': results[0] if not isinstance(results[0], Exception) else None,
        'wacc': results[1] if not isinstance(results[1], Exception) else None,
        'portfolio': results[2] if not isinstance(results[2], Exception) else None,
        'contacts': results[3] if not isinstance(results[3], Exception) else None,
    }
    
    return data_dict


# ============================================================================
# SEARCH & QUERY FUNCTIONS
# ============================================================================

async def search_companies(query: str, limit: int = 10) -> Optional[pd.DataFrame]:
    """Search companies by name using full-text search"""
    try:
        response = await asyncio.to_thread(
            lambda: supabase_db.client.table(TABLES["dataset"])
            .select("*")
            .ilike("company", f"%{query}%")  # Case-insensitive substring search
            .limit(limit)
            .execute()
        )
        df = pd.DataFrame(response.data)
        logger.info(f"✅ Found {len(df)} companies matching '{query}'")
        return df
    except APIError as e:
        logger.error(f"❌ Search failed: {str(e)}")
        return None


async def get_company_by_id(company_id: str) -> Optional[Dict]:
    """Get specific company by ID"""
    try:
        response = await asyncio.to_thread(
            lambda: supabase_db.client.table(TABLES["dataset"])
            .select("*")
            .eq("id", company_id)
            .single()
            .execute()
        )
        logger.info(f"✅ Loaded company {company_id}")
        return response.data
    except APIError as e:
        logger.error(f"❌ Failed to get company: {str(e)}")
        return None


async def get_sector_data(category_code: str) -> Optional[Dict]:
    """Get WACC and percentile data for a specific sector"""
    try:
        response = await asyncio.to_thread(
            lambda: supabase_db.client.table(TABLES["wacc"])
            .select("*")
            .eq("category_code", category_code)
            .single()
            .execute()
        )
        logger.info(f"✅ Loaded sector data for category {category_code}")
        return response.data
    except APIError as e:
        logger.error(f"❌ Failed to get sector data: {str(e)}")
        return None


# ============================================================================
# WRITE OPERATIONS (for caching/logging results)
# ============================================================================

async def save_analysis_result(company_id: str, analysis_type: str, result_data: Dict) -> bool:
    """Save analysis results to a cache table (optional)"""
    try:
        response = await asyncio.to_thread(
            lambda: supabase_db.client.table("analysis_cache")
            .insert({
                "company_id": company_id,
                "analysis_type": analysis_type,
                "result": result_data,
            })
            .execute()
        )
        logger.info(f"✅ Saved {analysis_type} analysis for company {company_id}")
        return True
    except APIError as e:
        logger.error(f"❌ Failed to save analysis: {str(e)}")
        return False
