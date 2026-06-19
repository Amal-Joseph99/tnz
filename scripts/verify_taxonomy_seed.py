"""Verify Excel taxonomy rows match seed migration exactly."""
from __future__ import annotations

import re
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "BZEAD_Global_Ecommerce_Taxonomy.xlsx"
SQL = ROOT / "supabase" / "migrations" / "20260620150000_seed_bzead_category_taxonomy.sql"


def format_hsn(raw) -> str:
    if pd.isna(raw):
        raise ValueError("missing HSN")
    if isinstance(raw, float) and raw == int(raw):
        raw = int(raw)
    digits = re.sub(r"\D", "", str(raw).strip())
    if not digits:
        raise ValueError(f"invalid HSN: {raw!r}")
    return digits.zfill(8)


def load_excel_rows() -> list[tuple[str, str, str, str]]:
    df = pd.read_excel(XLSX)
    rows: list[tuple[str, str, str, str]] = []
    for idx, row in df.iterrows():
        rows.append(
            (
                str(row["Category"]).strip(),
                str(row["Subcategory"]).strip(),
                str(row["Product Type"]).strip(),
                format_hsn(row["8-Digit HS/HSN Code"]),
            )
        )
    return rows


def load_sql_rows() -> list[tuple[str, str, str, str]]:
    text = SQL.read_text(encoding="utf-8")
    pattern = re.compile(
        r"\('((?:''|[^'])*)', '((?:''|[^'])*)', '((?:''|[^'])*)', '(\d{8})'\)"
    )
    return [
        (a.replace("''", "'"), b.replace("''", "'"), c.replace("''", "'"), d)
        for a, b, c, d in pattern.findall(text)
    ]


def main() -> None:
    excel_rows = load_excel_rows()
    sql_rows = load_sql_rows()

    excel_set = set(excel_rows)
    sql_set = set(sql_rows)

    missing_in_sql = [r for r in excel_rows if r not in sql_set]
    extra_in_sql = [r for r in sql_rows if r not in excel_set]

    print("=== BZEAD taxonomy verification ===")
    print(f"Excel rows: {len(excel_rows)}")
    print(f"SQL rows:   {len(sql_rows)}")
    print(f"Excel unique paths: {len(excel_set)}")
    print(f"SQL unique paths:   {len(sql_set)}")
    print()

    if missing_in_sql:
        print(f"MISSING from SQL ({len(missing_in_sql)}):")
        for i, row in enumerate(missing_in_sql, 1):
            print(f"  {i}. {row[0]} | {row[1]} | {row[2]} | {row[3]}")
    else:
        print("MISSING from SQL: none")

    print()

    if extra_in_sql:
        print(f"EXTRA in SQL not in Excel ({len(extra_in_sql)}):")
        for i, row in enumerate(extra_in_sql, 1):
            print(f"  {i}. {row[0]} | {row[1]} | {row[2]} | {row[3]}")
    else:
        print("EXTRA in SQL: none")

    print()
    print("=== Full Excel listing ===")
    for i, row in enumerate(excel_rows, 1):
        in_sql = "OK" if row in sql_set else "MISSING"
        print(f"{i:2}. [{in_sql}] {row[0]} | {row[1]} | {row[2]} | {row[3]}")

    if missing_in_sql or extra_in_sql or len(excel_rows) != len(sql_rows):
        raise SystemExit(1)

    print()
    print("PASS: all Excel rows are present in SQL migration.")


if __name__ == "__main__":
    main()
