# api/import_csv.py
"""
CSV import utilities for Supabase
Use this to populate your tables from CSV files
"""

import pandas as pd
import asyncio
from typing import Optional, Dict
import logging
from pathlib import Path

from .database import supabase_db
from .config import TABLES

logger = logging.getLogger(__name__)

# ============================================================================
# CSV COLUMN MAPPING
# ============================================================================

CSV_CONFIG = {
    "contacts": {
        "file": "IT.csv",
        "table": TABLES["contacts"],
        "columns": {
            "bvd_id_number": "bvd_id_number",
            "name_native": "name_native",
            "street_no_building_etc_line_1_native_": "street_no_building_etc_line_1_native_",
            "postcode": "postcode",
            "city_native_": "city_native_",
            "country_iso_code": "country_iso_code",
            "telephone_number": "telephone_number",
            "fax_number": "fax_number",
            "website_address": "website_address",
            "e_mail_address":"e_mail_address",
            "region_in_country":"region_in_country",
            "type_of_region_in_country":"type_of_region_in_country",
            "nuts1":"nuts1",
            "nuts2":"nuts2",
            "nuts3":"nuts3",
            "latitude":"latitude",
            "longitude":"longitude",
            "short_bvf_id_number":"short_bvf_id_number"
        }
    },
    "financial": {
        "file": "IT_fin.csv",
        "table": TABLES["financial_statements"],
        "columns": {
            "company_id": "company_id",
            "company_name": "company_name",
            "fiscal_year": "fiscal_year",
            "long_term_debt": "long_term_debt",
            "shareholders_funds": "shareholders_funds",
            "operating_revenue": "operating_revenue",
            "cost_of_employees": "cost_of_employees",
            "ebitda": "ebitda"
        }
    },
    "companies": {
        "file": "IT_info.csv",
        "table": TABLES["dataset"],
        "columns": {
            "company": "company",
            "nace": "nace",
            "ebit": "ebit",
            "employees": "employees",
            "revenue": "revenue",
            "net_income": "net_income",
            "capex": "capex",
            "d_and_a": "d_and_a",
            "changes_in_wc": "changes_in_wc",
            "lt_debt": "lt_debt",
            "st_debt": "st_debt",
            "sh_equity": "sh_equity",
            "capital_equity": "capital_equity",
            "cash": "cash",
            "category_code": "category_code"
        }
    }
}


# ============================================================================
# CSV IMPORT FUNCTIONS
# ============================================================================

async def import_csv_to_table(
    csv_type: str,
    csv_file_path: Optional[str] = None,
    chunk_size: int = 100
) -> Dict:
    """
    Import CSV file to Supabase table
    
    Args:
        csv_type: 'contacts', 'financial', or 'companies'
        csv_file_path: Path to CSV file (optional, uses default from CSV_CONFIG)
        chunk_size: Number of rows to insert at once
    
    Returns:
        Dict with import stats (rows_imported, errors, etc.)
    """
    
    if csv_type not in CSV_CONFIG:
        raise ValueError(f"Invalid csv_type: {csv_type}. Must be one of: {list(CSV_CONFIG.keys())}")
    
    config = CSV_CONFIG[csv_type]
    file_path = csv_file_path or config["file"]
    table_name = config["table"]
    
    # Read CSV
    try:
        logger.info(f"📖 Reading CSV: {file_path}")
        df = pd.read_csv(file_path)
        logger.info(f"✅ Loaded {len(df)} rows from {file_path}")
    except FileNotFoundError:
        logger.error(f"❌ File not found: {file_path}")
        return {"status": "error", "message": f"File not found: {file_path}"}
    except Exception as e:
        logger.error(f"❌ Error reading CSV: {str(e)}")
        return {"status": "error", "message": str(e)}
    
    # Map columns
    try:
        df_mapped = df.rename(columns={v: k for k, v in config["columns"].items()})
        # Keep only mapped columns
        df_mapped = df_mapped[list(config["columns"].keys())]
        logger.info(f"✅ Mapped columns for {table_name}")
    except KeyError as e:
        logger.error(f"❌ Column mapping error: {str(e)}")
        return {"status": "error", "message": f"Column not found: {str(e)}"}
    
    # Clean data
    df_mapped = df_mapped.fillna(None)  # Convert NaN to None for PostgreSQL
    
    # Insert in chunks
    total_rows = len(df_mapped)
    rows_inserted = 0
    errors = []
    
    for i in range(0, total_rows, chunk_size):
        chunk = df_mapped.iloc[i:i+chunk_size]
        chunk_dict = chunk.to_dict(orient='records')
        
        try:
            logger.info(f"⏳ Inserting chunk {i//chunk_size + 1}/{(total_rows + chunk_size - 1)//chunk_size}...")
            
            response = await asyncio.to_thread(
                lambda: supabase_db.client.table(table_name).insert(chunk_dict).execute()
            )
            
            rows_inserted += len(chunk_dict)
            logger.info(f"✅ Inserted {len(chunk_dict)} rows")
            
        except Exception as e:
            error_msg = f"Chunk {i//chunk_size + 1}: {str(e)}"
            errors.append(error_msg)
            logger.error(f"❌ {error_msg}")
    
    result = {
        "status": "success" if not errors else "partial",
        "table": table_name,
        "rows_inserted": rows_inserted,
        "total_rows": total_rows,
        "errors": errors if errors else None
    }
    
    logger.info(f"✅ Import complete: {result}")
    return result


# ============================================================================
# BATCH IMPORT ALL CSVs
# ============================================================================

async def import_all_csvs(csv_directory: str = ".") -> Dict:
    """
    Import all CSV files at once
    
    Args:
        csv_directory: Directory containing CSV files
    
    Returns:
        Dict with results for each import
    """
    
    results = {}
    
    for csv_type, config in CSV_CONFIG.items():
        file_path = Path(csv_directory) / config["file"]
        
        if not file_path.exists():
            logger.warning(f"⚠️ Skipping {csv_type}: File not found at {file_path}")
            results[csv_type] = {"status": "skipped", "message": "File not found"}
            continue
        
        logger.info(f"\n{'='*60}")
        logger.info(f"📥 Importing {csv_type} from {file_path}")
        logger.info(f"{'='*60}")
        
        result = await import_csv_to_table(csv_type, str(file_path))
        results[csv_type] = result
    
    return results


# ============================================================================
# VERIFY IMPORTS
# ============================================================================

async def verify_imports() -> Dict:
    """
    Verify that data was imported correctly
    Returns row counts for each table
    """
    
    verification = {}
    
    for table_name in [TABLES["dataset"], TABLES["contacts"], TABLES["financial_statements"]]:
        try:
            response = await asyncio.to_thread(
                lambda t=table_name: supabase_db.client.table(t).select("count", count="exact").execute()
            )
            count = response.count if hasattr(response, 'count') else len(response.data)
            verification[table_name] = {
                "status": "ok",
                "row_count": count
            }
            logger.info(f"✅ {table_name}: {count} rows")
        except Exception as e:
            verification[table_name] = {
                "status": "error",
                "error": str(e)
            }
            logger.error(f"❌ {table_name}: {str(e)}")
    
    return verification


# ============================================================================
# CLEAR TABLE (USE WITH CAUTION)
# ============================================================================

async def clear_table(table_name: str) -> bool:
    """
    Delete all rows from a table (WARNING: destructive)
    """
    try:
        logger.warning(f"🗑️ Clearing table: {table_name}")
        await asyncio.to_thread(
            lambda: supabase_db.client.table(table_name).delete().neq('id', 0).execute()
        )
        logger.info(f"✅ Table {table_name} cleared")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to clear table: {str(e)}")
        return False


# ============================================================================
# CLI INTERFACE
# ============================================================================

async def main():
    """Run import from command line"""
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "all":
            print("\n📥 Importing all CSV files...")
            results = await import_all_csvs()
            print("\n📊 Import Results:")
            for csv_type, result in results.items():
                print(f"  {csv_type}: {result}")
        elif sys.argv[1] == "verify":
            print("\n✅ Verifying imports...")
            verification = await verify_imports()
            print("\n📊 Verification Results:")
            for table, result in verification.items():
                print(f"  {table}: {result}")
        elif sys.argv[1] == "clear":
            if len(sys.argv) > 2:
                table = sys.argv[2]
                await clear_table(table)
            else:
                print("Usage: python -m api.import_csv clear <table_name>")
        else:
            csv_type = sys.argv[1]
            print(f"\n📥 Importing {csv_type}...")
            result = await import_csv_to_table(csv_type)
            print(f"Result: {result}")
    else:
        print("Usage: python -m api.import_csv [all|verify|contacts|financial|companies|clear <table>]")


if __name__ == "__main__":
    asyncio.run(main())
