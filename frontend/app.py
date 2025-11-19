# frontend/app.py
"""
Streamlit app configured to call Vercel API instead of loading from Dropbox
All UI logic preserved, data source changed to API
"""

import streamlit as st
import pandas as pd
import requests
from typing import Optional
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

# API endpoint (Vercel)
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
API_PREFIX = "/api/v1"

# Page config
st.set_page_config(
    page_title="Incrolink Agent v2",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("🏢 Incrolink Agent v2")
st.markdown("*Powered by Supabase + Vercel*")

# ============================================================================
# API CLIENT FUNCTIONS
# ============================================================================

@st.cache_data(ttl=3600)
def get_all_data():
    """Fetch all data from Vercel API"""
    try:
        response = requests.get(f"{API_BASE_URL}{API_PREFIX}/data/all", timeout=25)
        response.raise_for_status()
        return response.json()["data"]
    except Exception as e:
        st.error(f"❌ Failed to load data from API: {str(e)}")
        return None


def search_companies(query: str):
    """Search companies via API"""
    try:
        response = requests.get(
            f"{API_BASE_URL}{API_PREFIX}/search/companies",
            params={"query": query, "limit": 20},
            timeout=10
        )
        response.raise_for_status()
        return response.json()["data"]
    except Exception as e:
        st.error(f"❌ Search failed: {str(e)}")
        return []


def run_frame1_analysis(company_data: dict):
    """Run Frame 1: Financial Metrics Analysis"""
    try:
        response = requests.post(
            f"{API_BASE_URL}{API_PREFIX}/analysis/frame1",
            json=company_data,
            timeout=25
        )
        response.raise_for_status()
        return response.json()["data"]
    except Exception as e:
        st.error(f"❌ Frame 1 analysis failed: {str(e)}")
        return None


def run_frame2_analysis(company_data: dict):
    """Run Frame 2: DCF Valuation"""
    try:
        response = requests.post(
            f"{API_BASE_URL}{API_PREFIX}/analysis/frame2",
            json=company_data,
            timeout=25
        )
        response.raise_for_status()
        return response.json()["data"]
    except Exception as e:
        st.error(f"❌ Frame 2 analysis failed: {str(e)}")
        return None


def run_frame3_analysis(analysis_data: dict):
    """Run Frame 3: Predictability"""
    try:
        response = requests.post(
            f"{API_BASE_URL}{API_PREFIX}/analysis/frame3",
            json=analysis_data,
            timeout=25
        )
        response.raise_for_status()
        return response.json()["data"]
    except Exception as e:
        st.error(f"❌ Frame 3 analysis failed: {str(e)}")
        return None


# ============================================================================
# UI COMPONENTS
# ============================================================================

def display_frame1_results(frame1_data: dict):
    """Display Frame 1 analysis results"""
    st.subheader("📊 Frame 1: Financial Metrics Analysis")
    
    col1, col2, col3 = st.columns(3)
    
    metrics = frame1_data.get('metrics', {})
    positions = frame1_data.get('positions', {})
    
    with col1:
        st.metric("LTDE", f"{metrics.get('ltde', 'N/A'):.4f}" if metrics.get('ltde') else "N/A")
        if 'ltde' in positions:
            st.write(f"Rank: {positions['ltde']['rank']}")
    
    with col2:
        st.metric("EDAMARGIN", f"{metrics.get('edamargin', 'N/A'):.4f}" if metrics.get('edamargin') else "N/A")
        if 'edamargin' in positions:
            st.write(f"Rank: {positions['edamargin']['rank']}")
    
    with col3:
        st.metric("FX", f"{metrics.get('fx', 'N/A'):.4f}" if metrics.get('fx') else "N/A")
        if 'fx' in positions:
            st.write(f"Rank: {positions['fx']['rank']}")


def display_frame2_results(frame2_data: dict):
    """Display Frame 2 valuation results"""
    st.subheader("💰 Frame 2: Valuation")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Current EV", f"€{frame2_data.get('EV_current', 0):,.0f}")
    
    with col2:
        st.metric("DCF EV", f"€{frame2_data.get('EV_DCF', 0):,.0f}")
    
    with col3:
        st.metric("EV Growth", f"{frame2_data.get('growth_expected', 0):.2%}")
        st.write(f"Classification: **{frame2_data.get('classification', 'N/A')}**")


def display_frame3_results(frame3_data: dict):
    """Display Frame 3 predictability results"""
    st.subheader("🎯 Frame 3: Predictability")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.metric("Leaf Value", frame3_data.get('leaf_value', 'N/A'))
    
    with col2:
        st.metric("Category", frame3_data.get('category', 'N/A'))
    
    st.write("**Decision Path:**")
    for i, step in enumerate(frame3_data.get('decision_path', []), 1):
        st.write(f"{i}. {step}")


# ============================================================================
# MAIN APPLICATION
# ============================================================================

def main():
    
    # Sidebar configuration
    st.sidebar.header("⚙️ Configuration")
    
    if st.sidebar.button("🚀 Load Data from Supabase", use_container_width=True):
        with st.spinner("Loading data from Supabase..."):
            data = get_all_data()
            if data:
                st.session_state.data = data
                st.sidebar.success("✅ Data loaded successfully!")
    
    st.markdown("---")
    
    # Check if data is loaded
    if 'data' not in st.session_state:
        st.info("👈 Click **Load Data from Supabase** to begin")
        return
    
    data = st.session_state.data
    
    # Main interface
    st.subheader("🎯 Select Workflow Mode")
    
    workflow_mode = st.radio(
        "Choose your analysis mode:",
        options=["Review Company", "Search for Deals"],
        horizontal=True
    )
    
    st.markdown("---")
    
    if workflow_mode == "Review Company":
        review_company_mode(data)
    elif workflow_mode == "Search for Deals":
        st.info("🚧 Deal search feature coming soon - optimized for Supabase")


def review_company_mode(data: dict):
    """Review individual company analysis"""
    
    dataset_records = data.get('dataset', [])
    
    if not dataset_records:
        st.error("❌ No companies found in dataset")
        return
    
    st.subheader("🏢 Review Company - Evaluate Individual Company")
    
    # Search input
    search_query = st.text_input("Search company name (case-insensitive)")
    
    if not search_query:
        st.info("Enter a company name to search")
        return
    
    # Search via API
    results = search_companies(search_query)
    
    if not results:
        st.warning(f"No companies found matching '{search_query}'")
        return
    
    st.write(f"Found {len(results)} company(ies)")
    
    # Select company
    selected_idx = st.selectbox(
        "Select a company:",
        range(len(results)),
        format_func=lambda i: results[i].get('company', 'Unknown')
    )
    
    selected_company = results[selected_idx]
    
    st.markdown("---")
    
    if st.button("📊 Run Full Analysis", use_container_width=True):
        
        # Create tabs for frames
        tab1, tab2, tab3 = st.tabs(["Frame 1: Metrics", "Frame 2: Valuation", "Frame 3: Predictability"])
        
        with tab1:
            with st.spinner("Running Frame 1 analysis..."):
                frame1_data = run_frame1_analysis(selected_company)
                if frame1_data:
                    display_frame1_results(frame1_data)
                    st.session_state.frame1_data = frame1_data
        
        with tab2:
            with st.spinner("Running Frame 2 analysis..."):
                frame2_data = run_frame2_analysis(selected_company)
                if frame2_data:
                    display_frame2_results(frame2_data)
                    st.session_state.frame2_data = frame2_data
        
        with tab3:
            with st.spinner("Running Frame 3 analysis..."):
                # Prepare data for Frame 3
                frame2_data = st.session_state.get('frame2_data', {})
                frame1_data = st.session_state.get('frame1_data', {})
                
                analysis_data = {
                    'company_name': selected_company.get('company'),
                    'ev_growth': frame2_data.get('growth_expected', 0),
                    'nsellside': float('nan'),
                    'nsellside_p50': float('nan'),
                    'ceo_age': None,
                    'revenue': selected_company.get('net_income', 0),
                    'edamargin': frame1_data.get('metrics', {}).get('edamargin', float('nan')),
                    'edamargin_p75': float('nan')
                }
                
                frame3_data = run_frame3_analysis(analysis_data)
                if frame3_data:
                    display_frame3_results(frame3_data)


if __name__ == "__main__":
    main()
