# lib/predictability.py
"""
Predictability decision tree and classification - UNCHANGED from original
Frame 3 logic preserved exactly
"""

import numpy as np
import pandas as pd
from typing import Tuple, List, Dict


PREDICTABILITY_CATEGORIES = {
    "0": "low growth",
    "0,23": "good growth, low sell side operations",
    "0,43": "good financials and sector conditions, but Management too young",
    "0,54": "good company and sector conditions, but revenue is too small",
    "0,65": "optimal conditions, but margins are weak",
    "0,8": "optimal conditions"
}


def predictability_decision_tree(
    ev_growth: float,
    nsellside: float,
    nsellside_p50: float,
    ceo_age: float,
    revenue: float,
    edamargin: float,
    edamargin_p75: float
) -> Tuple[str, str, List[str]]:
    """
    Decision tree for predictability classification
    
    LOGIC: EXACTLY PRESERVED FROM ORIGINAL
    
    Returns:
        (leaf_value, category_description, decision_path)
    """
    path = []
    
    # Step 1: Check EV Growth
    path.append(f"EV Growth: {ev_growth:.2%}")
    if ev_growth < 0.15:
        return "0", PREDICTABILITY_CATEGORIES["0"], path
    
    # Step 2: Check N Sell Side
    path.append(f"N Sell Side: {nsellside} vs P50: {nsellside_p50}")
    if not np.isnan(nsellside) and not np.isnan(nsellside_p50) and nsellside < nsellside_p50:
        return "0,23", PREDICTABILITY_CATEGORIES["0,23"], path
    
    # Step 3: Check CEO Age
    path.append(f"CEO Age: {ceo_age}")
    if ceo_age is not None and not np.isnan(ceo_age) and ceo_age < 60:
        return "0,43", PREDICTABILITY_CATEGORIES["0,43"], path
    
    # Step 4: Check Revenue
    path.append(f"Revenue: €{revenue:,.0f}")
    if not np.isnan(revenue) and revenue < 90000000:
        return "0,54", PREDICTABILITY_CATEGORIES["0,54"], path
    
    # Step 5: Check EDAMARGIN
    path.append(f"EDAMARGIN: {edamargin:.4f} vs P75: {edamargin_p75:.4f}")
    if not np.isnan(edamargin) and not np.isnan(edamargin_p75) and edamargin < edamargin_p75:
        return "0,65", PREDICTABILITY_CATEGORIES["0,65"], path
    
    # All conditions met
    return "0,8", PREDICTABILITY_CATEGORIES["0,8"], path
