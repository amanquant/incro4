# lib/valuation.py
"""
DCF Valuation calculations - UNCHANGED from original
All formulas and logic preserved exactly
"""

import numpy as np
import pandas as pd
from typing import Dict


def DCF_automated(company_row: pd.Series, waccmap: pd.DataFrame, years: int = 5) -> Dict:
    """
    Calculate DCF valuation for a company
    
    LOGIC: EXACTLY PRESERVED FROM ORIGINAL
    
    Args:
        company_row: Series with company financial data
        waccmap: DataFrame with WACC parameters by category_code
        years: Projection period (default 5 years)
    
    Returns:
        Dict with EV_current, EV_DCF, growth_expected, and detailed breakdowns
    """
    
    # Extract financial data
    sh_equity = company_row['sh_equity']
    capital_equity = company_row['capital_equity']
    lt_debt = company_row['lt_debt']
    st_debt = company_row['st_debt']
    cash = company_row['cash']
    
    # Calculate current Enterprise Value
    EV_current = sh_equity + lt_debt + st_debt - cash
    
    # Get WACC parameters by category code
    category_code = str(company_row['category_code'])
    params_match = waccmap[waccmap['category_code'].astype(str) == category_code]
    
    if not params_match.empty:
        re = params_match.iloc[0]['re']
        rd = params_match.iloc[0]['rd']
        wacc = params_match.iloc[0]['wacc']
        g = params_match.iloc[0]['g']
    else:
        re = rd = wacc = g = np.nan
    
    # Extract cash flow components
    net_income = company_row['net_income']
    d_and_a = company_row['d_and_a']
    capex = company_row['capex']
    changes_in_wc = company_row['changes_in_wc']
    
    # Calculate Free Cash Flow
    FCF0 = net_income + d_and_a - capex - changes_in_wc
    
    # Project FCF for projection period
    FCFs = [FCF0 * ((1 + g) ** n) for n in range(1, years + 1)]
    
    # Calculate Terminal Value
    TV = FCFs[-1] / (wacc - g) if (wacc - g) != 0 else 0
    
    # Discount all cash flows
    discount_factors = [(1 + wacc) ** n for n in range(1, years + 1)]
    discounted_FCFs = [f / d for f, d in zip(FCFs, discount_factors)]
    discounted_TV = TV / discount_factors[-1]
    
    # Calculate DCF Enterprise Value
    EV_DCF = sum(discounted_FCFs) + discounted_TV
    
    # Calculate expected growth
    growth_expected = (EV_DCF / EV_current) - 1 if EV_current else np.nan
    
    return {
        'EV_current': EV_current,
        'EV_DCF': EV_DCF,
        'growth_expected': growth_expected,
        'category_code': category_code,
        'params': dict(re=re, rd=rd, wacc=wacc, g=g),
        'FCF0': FCF0,
        'FCFs': FCFs,
        'TV': TV,
        'discounted_FCFs': discounted_FCFs,
        'discounted_TV': discounted_TV,
        'years': years
    }


def classify_by_growth(growth_expected: float) -> str:
    """
    Classify company based on DCF growth rate
    Used in deal search filtering
    """
    if growth_expected < 0:
        return "Bit Overvalued"
    elif 0 <= growth_expected < 0.20:
        return "Good Deal"
    else:  # growth_expected >= 0.20
        return "Top Pick"
