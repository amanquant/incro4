# lib/metrics.py
"""
Financial metrics calculations - UNCHANGED from original
All formulas preserved exactly
"""

import numpy as np
import pandas as pd
from typing import Dict


def calculate_metrics_from_dataset(company_row: pd.Series) -> Dict:
    """
    Calculate LTDE, FX, EDAMARGIN from dataset columns
    
    LOGIC: EXACTLY PRESERVED FROM ORIGINAL
    """
    metrics = {}
    
    try:
        lt_debt = company_row.get('lt_debt', np.nan)
        sh_equity = company_row.get('sh_equity', np.nan)
        
        # LTDE: Long-term Debt / Shareholders' Equity
        if not pd.isna(sh_equity) and sh_equity != 0 and not pd.isna(lt_debt):
            metrics['ltde'] = lt_debt / sh_equity
        else:
            metrics['ltde'] = np.nan
        
        # EDAMARGIN: (EBIT + D&A) / Revenue
        ebit = company_row.get('ebit', np.nan)
        d_and_a = company_row.get('d_and_a', np.nan)
        revenue = company_row.get('revenue', np.nan)
        
        if not pd.isna(revenue) and revenue != 0:
            ebitda = ebit + d_and_a if (not pd.isna(ebit) and not pd.isna(d_and_a)) else np.nan
            if not pd.isna(ebitda):
                metrics['edamargin'] = ebitda / revenue
            else:
                metrics['edamargin'] = np.nan
        else:
            metrics['edamargin'] = np.nan
        
        # FX: Cost of Employees / Revenue (from financial statement)
        metrics['fx'] = np.nan  # Loaded from financial statements
        
        return metrics
        
    except Exception as e:
        return {'ltde': np.nan, 'edamargin': np.nan, 'fx': np.nan}


def get_percentile_position(value: float, percentiles_dict: Dict) -> tuple:
    """
    Calculate company's percentile position within sector range
    
    Args:
        value: Company metric value
        percentiles_dict: Dict with p10, p25, p50, p75, p90
    
    Returns:
        (position_string, rank_string, percentile_range_string)
    
    LOGIC: EXACTLY PRESERVED FROM ORIGINAL
    """
    
    if np.isnan(value):
        return None, None, "N/A"
    
    p10 = percentiles_dict.get('p10', np.nan)
    p25 = percentiles_dict.get('p25', np.nan)
    p50 = percentiles_dict.get('p50', np.nan)
    p75 = percentiles_dict.get('p75', np.nan)
    p90 = percentiles_dict.get('p90', np.nan)
    
    if value < p10:
        position = "Below P10"
        rank = "Exceptional (Bottom)"
    elif value < p25:
        position = "P10-P25"
        rank = "Q1 (Very Low)"
    elif value < p50:
        position = "P25-P50"
        rank = "Q2 (Below Median)"
    elif value < p75:
        position = "P50-P75"
        rank = "Q3 (Above Median)"
    elif value < p90:
        position = "P75-P90"
        rank = "Q4 (High)"
    else:
        position = "Above P90"
        rank = "Exceptional (Top)"
    
    percentile_range = f"{p10:.4f} | {p25:.4f} | {p50:.4f} | {p75:.4f} | {p90:.4f}"
    
    return position, rank, percentile_range


def get_sector_percentiles(category_code: str, waccmap: pd.DataFrame) -> Dict:
    """
    Retrieve sector percentile ranges for LTDE, EDAMARGIN, FX
    
    LOGIC: EXACTLY PRESERVED FROM ORIGINAL
    """
    percentiles = {}
    
    category_data = waccmap[waccmap['category_code'].astype(str) == str(category_code)]
    
    if not category_data.empty:
        row = category_data.iloc[0]
        
        percentiles['ltde'] = {
            'p10': row.get('ltde10th', np.nan),
            'p25': row.get('ltde25th', np.nan),
            'p50': row.get('ltde50th', np.nan),
            'p75': row.get('ltde75th', np.nan),
            'p90': row.get('ltde90th', np.nan)
        }
        
        percentiles['edamargin'] = {
            'p10': row.get('edamarg10th', np.nan),
            'p25': row.get('edamarg25th', np.nan),
            'p50': row.get('edamarg50th', np.nan),
            'p75': row.get('edamarg75th', np.nan),
            'p90': row.get('edamarg90th', np.nan)
        }
        
        percentiles['fx'] = {
            'p10': row.get('fx10th', np.nan),
            'p25': row.get('fx25th', np.nan),
            'p50': row.get('fx50th', np.nan),
            'p75': row.get('fx75th', np.nan),
            'p90': row.get('fx90th', np.nan)
        }
        
        percentiles['nsellside_p50'] = row.get('nsellside50th', np.nan)
        percentiles['nsellside'] = row.get('nsellside', np.nan)
    
    return percentiles
