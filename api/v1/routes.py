# api/v1/routes.py
"""
FastAPI routes for Vercel deployment
All endpoints preserve the original logic via lib/ modules
"""

import sys
import os
from fastapi import FastAPI, HTTPException, Query
from typing import Optional, Dict, List
import pandas as pd
import logging
from fastapi.responses import JSONResponse

# --- FIX START: Add Project Root to Path ---
# This allows us to import 'lib' even if Vercel thinks 'api' is the root.
# We go up 3 levels: routes.py -> v1 -> api -> PROJECT_ROOT
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from api.config import config, TABLES
from api.database import (
    load_dataset, load_wacc_map, load_portfolio, load_contacts,
    search_companies, get_company_by_id, get_sector_data, load_all_data
)

# Corrected lines: lib.valuation (not lib/valuation)
from incro4.lib.valuation import DCF_automated, classify_by_growth
from lib.metrics import calculate_metrics_from_dataset, get_sector_percentiles, get_percentile_position
from lib.predictability import predictability_decision_tree

logger = logging.getLogger(__name__)
app = FastAPI(title="Incrolink API", version="2.0.0")

@app.get("/health")
async def health_check():
    """Health check endpoint for Vercel"""
    return {
        "status": "healthy",
        "environment": getattr(config, 'vercel_env', 'production'),
        "version": "2.0.0"
    }

# ============================================================================
# DATA LOADING ENDPOINTS
# ============================================================================

@app.get(f"{config.api_prefix}/data/all")
async def get_all_data():
    """Load all data (dataset, wacc, portfolio, contacts)"""
    try:
        data = await load_all_data()
        
        # Convert DataFrames to JSON-serializable dicts
        response = {
            "dataset": data["dataset"].to_dict(orient="records") if data["dataset"] is not None else None,
            "wacc": data["wacc"].to_dict(orient="records") if data["wacc"] is not None else None,
            "portfolio": data["portfolio"].to_dict(orient="records") if data["portfolio"] is not None else None,
            "contacts": data["contacts"].to_dict(orient="records") if data["contacts"] is not None else None,
        }
        
        return {"status": "success", "data": response}
    
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load data: {str(e)}")


@app.get(f"{config.api_prefix}/data/dataset")
async def get_dataset():
    """Load companies dataset"""
    try:
        df = await load_dataset()
        if df is None:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return {"status": "success", "data": df.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{config.api_prefix}/data/wacc")
async def get_wacc():
    """Load WACC map"""
    try:
        df = await load_wacc_map()
        if df is None:
            raise HTTPException(status_code=404, detail="WACC data not found")
        return {"status": "success", "data": df.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# SEARCH ENDPOINTS
# ============================================================================

@app.get(f"{config.api_prefix}/search/companies")
async def search_companies_endpoint(
    query: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=100)
):
    """Search companies by name"""
    try:
        df = await search_companies(query, limit)
        if df is None or df.empty:
            return {"status": "success", "data": [], "count": 0}
        return {"status": "success", "data": df.to_dict(orient="records"), "count": len(df)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get(f"{config.api_prefix}/company/{company_id}")
async def get_company_endpoint(company_id: str):
    """Get specific company by ID"""
    try:
        company = await get_company_by_id(company_id)
        if company is None:
            raise HTTPException(status_code=404, detail="Company not found")
        return {"status": "success", "data": company}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ANALYTICS ENDPOINTS - Frame 1-4 Logic
# ============================================================================

@app.post(f"{config.api_prefix}/analysis/frame1")
async def frame1_analysis_endpoint(company_data: Dict):
    """
    Frame 1: Financial Metrics Analysis
    Input: company_data with company info
    Output: Metrics, sector comparison, percentiles
    """
    try:
        # Load required data
        dataset = await load_dataset()
        waccmap = await load_wacc_map()
        
        if dataset is None or waccmap is None:
            raise HTTPException(status_code=500, detail="Required data not available")
        
        company_row = pd.Series(company_data)
        
        # Calculate metrics
        company_metrics = calculate_metrics_from_dataset(company_row)
        
        # Get sector percentiles
        category_code = str(company_data.get('category_code'))
        sector_percentiles = get_sector_percentiles(category_code, waccmap)
        
        # Build response
        response = {
            "company_name": company_data.get('company'),
            "category_code": category_code,
            "metrics": company_metrics,
            "sector_percentiles": sector_percentiles,
            "positions": {}
        }
        
        # Calculate positions for each metric
        for metric in ['ltde', 'edamargin', 'fx']:
            if metric in company_metrics:
                position, rank, range_str = get_percentile_position(
                    company_metrics[metric],
                    sector_percentiles.get(metric, {})
                )
                response["positions"][metric] = {
                    "position": position,
                    "rank": rank,
                    "range": range_str
                }
        
        return {"status": "success", "data": response}
    
    except Exception as e:
        logger.error(f"Frame 1 error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post(f"{config.api_prefix}/analysis/frame2")
async def frame2_valuation_endpoint(company_data: Dict):
    """
    Frame 2: DCF Valuation Analysis
    Input: company_data with financial information
    Output: DCF valuation, growth rates, parameters
    """
    try:
        # Load WACC map
        waccmap = await load_wacc_map()
        if waccmap is None:
            raise HTTPException(status_code=500, detail="WACC data not available")
        
        company_row = pd.Series(company_data)
        
        # Run DCF
        dcf_result = DCF_automated(company_row, waccmap)
        
        # Classify by growth
        classification = classify_by_growth(dcf_result['growth_expected'])
        
        response = {
            "company_name": company_data.get('company'),
            "EV_current": float(dcf_result['EV_current']),
            "EV_DCF": float(dcf_result['EV_DCF']),
            "growth_expected": float(dcf_result['growth_expected']),
            "classification": classification,
            "parameters": {
                "Re": float(dcf_result['params']['re']) if not pd.isna(dcf_result['params']['re']) else None,
                "Rd": float(dcf_result['params']['rd']) if not pd.isna(dcf_result['params']['rd']) else None,
                "WACC": float(dcf_result['params']['wacc']) if not pd.isna(dcf_result['params']['wacc']) else None,
                "g": float(dcf_result['params']['g']) if not pd.isna(dcf_result['params']['g']) else None,
            },
            "FCF0": float(dcf_result['FCF0']),
            "Terminal_Value": float(dcf_result['TV'])
        }
        
        return {"status": "success", "data": response}
    
    except Exception as e:
        logger.error(f"Frame 2 error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post(f"{config.api_prefix}/analysis/frame3")
async def frame3_predictability_endpoint(analysis_data: Dict):
    """
    Frame 3: Predictability Classification
    Input: ev_growth, nsellside, ceo_age, revenue, edamargin, etc.
    Output: Decision tree classification
    """
    try:
        # Extract parameters
        ev_growth = analysis_data.get('ev_growth', 0)
        nsellside = analysis_data.get('nsellside', float('nan'))
        nsellside_p50 = analysis_data.get('nsellside_p50', float('nan'))
        ceo_age = analysis_data.get('ceo_age')
        revenue = analysis_data.get('revenue', float('nan'))
        edamargin = analysis_data.get('edamargin', float('nan'))
        edamargin_p75 = analysis_data.get('edamargin_p75', float('nan'))
        
        # Run decision tree
        leaf_value, category, path = predictability_decision_tree(
            ev_growth, nsellside, nsellside_p50, ceo_age, revenue, edamargin, edamargin_p75
        )
        
        response = {
            "company_name": analysis_data.get('company_name'),
            "leaf_value": leaf_value,
            "category": category,
            "decision_path": path
        }
        
        return {"status": "success", "data": response}
    
    except Exception as e:
        logger.error(f"Frame 3 error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# BATCH ANALYSIS ENDPOINT
# ============================================================================

@app.post(f"{config.api_prefix}/analysis/batch")
async def batch_analysis(companies_data: List[Dict]):
    """
    Run Frame 1-3 analysis on multiple companies
    Returns DCF valuations, growth classifications, predictability
    """
    try:
        waccmap = await load_wacc_map()
        if waccmap is None:
            raise HTTPException(status_code=500, detail="WACC data not available")
        
        results = []
        
        for company_data in companies_data:
            try:
                company_row = pd.Series(company_data)
                
                # Frame 2: DCF
                dcf_result = DCF_automated(company_row, waccmap)
                classification = classify_by_growth(dcf_result['growth_expected'])
                
                results.append({
                    "company": company_data.get('company'),
                    "EV_DCF": float(dcf_result['EV_DCF']),
                    "growth_expected": float(dcf_result['growth_expected']),
                    "classification": classification
                })
            except Exception as e:
                logger.warning(f"Failed to analyze {company_data.get('company')}: {str(e)}")
                continue
        
        return {"status": "success", "count": len(results), "data": results}
    
    except Exception as e:
        logger.error(f"Batch analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
