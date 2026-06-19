"""Generate SQL seed migration from BZEAD_Global_Ecommerce_Taxonomy.xlsx"""
from __future__ import annotations

import re
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "BZEAD_Global_Ecommerce_Taxonomy.xlsx"
OUT = ROOT / "supabase" / "migrations" / "20260620150000_seed_bzead_category_taxonomy.sql"


def escape_sql(value: str) -> str:
    return value.replace("'", "''")


def format_hsn(raw) -> str:
    if pd.isna(raw):
        raise ValueError("missing HSN code")
    if isinstance(raw, float) and raw == int(raw):
        raw = int(raw)
    digits = re.sub(r"\D", "", str(raw).strip())
    if not digits:
        raise ValueError(f"invalid HSN: {raw!r}")
    return digits.zfill(8)


def main() -> None:
    df = pd.read_excel(XLSX)
    expected = ["Category", "Subcategory", "Product Type", "8-Digit HS/HSN Code"]
    if list(df.columns) != expected:
        raise SystemExit(f"Unexpected columns: {list(df.columns)}")

    rows: list[tuple[str, str, str, str]] = []
    seen: set[tuple[str, str, str]] = set()

    for idx, row in df.iterrows():
        category = str(row["Category"]).strip()
        sub_category = str(row["Subcategory"]).strip()
        product_type = str(row["Product Type"]).strip()
        hsn = format_hsn(row["8-Digit HS/HSN Code"])

        if not category or not sub_category or not product_type:
            raise SystemExit(f"Row {idx}: empty name field")

        key = (category, sub_category, product_type)
        if key in seen:
            raise SystemExit(f"Row {idx}: duplicate path {key}")
        seen.add(key)
        rows.append((category, sub_category, product_type, hsn))

    lines = [
        "-- Seed BZEAD Global Ecommerce Taxonomy (all rows from BZEAD_Global_Ecommerce_Taxonomy.xlsx)",
        f"-- Total rows: {len(rows)}",
        "",
        "INSERT INTO public.product_category_taxonomy (",
        "  category_name,",
        "  sub_category_name,",
        "  product_type_name,",
        "  hsn_code",
        ")",
        "VALUES",
    ]

    value_lines = []
    for category, sub_category, product_type, hsn in rows:
        value_lines.append(
            f"  ('{escape_sql(category)}', '{escape_sql(sub_category)}', "
            f"'{escape_sql(product_type)}', '{hsn}')"
        )

    lines.append(",\n".join(value_lines))
    lines.append("ON CONFLICT (category_name, sub_category_name, product_type_name)")
    lines.append("DO UPDATE SET")
    lines.append("  hsn_code = EXCLUDED.hsn_code,")
    lines.append("  is_active = true,")
    lines.append("  updated_at = NOW();")
    lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {len(rows)} rows to {OUT}")


if __name__ == "__main__":
    main()
