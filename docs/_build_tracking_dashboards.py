#!/usr/bin/env python3
"""
Rebuild tracking dashboards for easy visibility:

1) Add "Work Bifurcation" on S03_ALL (+ week sheets) from Track + Layer
2) Rebuild S02_Sprint_Dashboard — by category, status, %, charts
3) Enhance 08_Dashboard — same bifurcation + overall % + charts

Source of status: Week sheets → S03/modules (already live-linked).
"""

from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.chart import BarChart, PieChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.formatting.rule import FormulaRule, DataBarRule

ROOT = Path("/Users/OctazenWork/NIGA_Homepathy/UI/NIGAHomeopathy_UI")
TARGET = ROOT / "NIGA_PENDING_IMPLEMENTATION_TASK_TRACKER (1).xlsx"

THIN = Border(
    left=Side(style="thin", color="D0D5DD"),
    right=Side(style="thin", color="D0D5DD"),
    top=Side(style="thin", color="D0D5DD"),
    bottom=Side(style="thin", color="D0D5DD"),
)
WRAP = Alignment(wrap_text=True, vertical="top")
CENTER = Alignment(wrap_text=True, vertical="center", horizontal="center")

FILLS = {
    "header": PatternFill("solid", fgColor="1B3A4B"),
    "gold": PatternFill("solid", fgColor="F9E79F"),
    "warn": PatternFill("solid", fgColor="FDEBD0"),
    "ok": PatternFill("solid", fgColor="D5F5E3"),
    "blue": PatternFill("solid", fgColor="D6EAF8"),
    "purple": PatternFill("solid", fgColor="E8DAEF"),
    "alt": PatternFill("solid", fgColor="F8F9F9"),
    "done": PatternFill("solid", fgColor="ABEBC6"),
    "wip": PatternFill("solid", fgColor="F9E79F"),
    "ns": PatternFill("solid", fgColor="FADBD8"),
    "blocked": PatternFill("solid", fgColor="F5B7B1"),
}
FONT_W = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
FONT_T = Font(name="Calibri", bold=True, color="1B3A4B", size=16)
FONT_H = Font(name="Calibri", bold=True, color="1B3A4B", size=12)
FONT_N = Font(name="Calibri", size=10, color="1C2833")
FONT_S = Font(name="Calibri", size=9, color="5D6D7E")

# Ordered categories for dashboards (user-facing bifurcation)
CATEGORIES = [
    "UI / Web UI / Web Frontend",
    "API (Web & Mobile)",
    "Mobile UI",
    "Mobile Frontend",
    "QA",
    "Database",
    "Security",
    "Integration",
    "Web Other",
    "Other",
]

STATUSES = ["Done", "In Progress", "Not Started", "Blocked", "Deferred", "N/A"]

WEEK_SHEETS = ["S1_Week1", "S2_Week2", "S3_Week3", "S4_Week4", "S5_Week5"]


def categorize(track: str, layer: str) -> str:
    t = (track or "").strip()
    ly = (layer or "").strip()
    lyl = ly.lower()

    if t == "QA" or lyl == "qa":
        return "QA"
    if lyl == "mobile ui":
        return "Mobile UI"
    if t == "Mobile" or "mobile" in lyl:
        if "client" in lyl or "ux" in lyl or lyl == "mobile":
            return "Mobile Frontend"
        return "Mobile UI"
    if lyl.startswith("api") or "api hygiene" in lyl or "api contract" in lyl or lyl == "api + spa":
        return "API (Web & Mobile)"
    if "database" in lyl:
        return "Database"
    if lyl == "security":
        return "Security"
    if lyl == "integration":
        return "Integration"
    if t == "UI" or lyl == "web spa" or lyl == "design":
        return "UI / Web UI / Web Frontend"
    if t == "Web":
        return "Web Other"
    return "Other"


def load_module_meta(wb):
    """sub_id -> {track, layer, module}"""
    meta = {}
    for sn in wb.sheetnames:
        if not (sn.startswith("M") and len(sn) > 1 and sn[1].isdigit()):
            continue
        ws = wb[sn]
        for r in range(3, ws.max_row + 1):
            sid = ws.cell(r, 11).value
            if not sid:
                continue
            meta[str(sid).strip()] = {
                "track": str(ws.cell(r, 5).value or ""),
                "layer": str(ws.cell(r, 19).value or ""),
                "module": str(ws.cell(r, 2).value or sn.split("_")[0]),
                "category": categorize(str(ws.cell(r, 5).value or ""), str(ws.cell(r, 19).value or "")),
            }
    return meta


def ensure_header(ws, header_row: int, title: str) -> int:
    for c in range(1, ws.max_column + 5):
        if ws.cell(header_row, c).value == title:
            return c
    # find last used header
    last = 1
    for c in range(1, ws.max_column + 5):
        if ws.cell(header_row, c).value:
            last = c
    col = last + 1
    cell = ws.cell(header_row, col, value=title)
    cell.fill = FILLS["header"]
    cell.font = FONT_W
    cell.alignment = CENTER
    cell.border = THIN
    ws.column_dimensions[get_column_letter(col)].width = 22
    return col


def add_bifurcation_column(wb, meta):
    """Write Work Bifurcation on S03 and each week sheet (static category for COUNTIFS)."""
    # S03
    ws = wb["S03_ALL_1000_Sprint_Tasks"]
    col = ensure_header(ws, 3, "Work Bifurcation")
    # Track col on S03 = 8, Sub = 13
    for r in range(4, ws.max_row + 1):
        sid = ws.cell(r, 13).value
        if not sid:
            continue
        cat = meta.get(str(sid).strip(), {}).get("category", "Other")
        cell = ws.cell(r, col, value=cat)
        cell.fill = FILLS["purple"]
        cell.font = FONT_N
        cell.border = THIN
        cell.alignment = CENTER
    print(f"S03 Work Bifurcation col={col}")

    # Week sheets
    for sn in WEEK_SHEETS:
        ws = wb[sn]
        col = ensure_header(ws, 3, "Work Bifurcation")
        # find Sub Task ID col
        sub_col = 13
        for c in ws[3]:
            if c.value == "Sub Task ID":
                sub_col = c.column
                break
        for r in range(4, ws.max_row + 1):
            sid = ws.cell(r, sub_col).value
            if not sid:
                continue
            cat = meta.get(str(sid).strip(), {}).get("category", "Other")
            cell = ws.cell(r, col, value=cat)
            cell.fill = FILLS["purple"]
            cell.font = FONT_N
            cell.border = THIN
            cell.alignment = CENTER
        print(f"{sn} Work Bifurcation col={col}")

    # Also on module sheets for filtering
    for sn in wb.sheetnames:
        if not (sn.startswith("M") and sn[1].isdigit()):
            continue
        ws = wb[sn]
        col = ensure_header(ws, 2, "Work Bifurcation")
        for r in range(3, ws.max_row + 1):
            sid = ws.cell(r, 11).value
            if not sid:
                continue
            cat = meta.get(str(sid).strip(), {}).get("category", "Other")
            cell = ws.cell(r, col, value=cat)
            cell.fill = FILLS["purple"]
            cell.font = FONT_N
            cell.border = THIN
    return col


def style_header_row(ws, row, headers, start_col=1):
    for i, h in enumerate(headers):
        cell = ws.cell(row, start_col + i, value=h)
        cell.fill = FILLS["header"]
        cell.font = FONT_W
        cell.alignment = CENTER
        cell.border = THIN


def rebuild_s02(wb):
    """Full S02_Sprint_Dashboard with bifurcation, %, charts."""
    if "S02_Sprint_Dashboard" in wb.sheetnames:
        del wb["S02_Sprint_Dashboard"]
    idx = wb.sheetnames.index("S01_Sprint_Calendar") + 1 if "S01_Sprint_Calendar" in wb.sheetnames else 12
    ws = wb.create_sheet("S02_Sprint_Dashboard", idx)

    ws["A1"] = "S02 — LIVE Sprint Tracking Dashboard (easy tracking)"
    ws["A1"].font = FONT_T
    ws.merge_cells("A1:L1")
    ws["A2"] = (
        "Status comes from S1_Week1…S5_Week5 (yellow). S03_ALL + Modules sync live. "
        "Work Bifurcation = UI / Web Frontend / Web UI / API / Mobile UI / Mobile Frontend / QA / …. "
        "Press Formulas → Calculate Now if % look stale."
    )
    ws["A2"].fill = FILLS["warn"]
    ws["A2"].alignment = WRAP
    ws.merge_cells("A2:L2")
    ws.row_dimensions[2].height = 36

    # ----- Overall KPIs -----
    ws["A4"] = "OVERALL (all 1000 tasks via S03_ALL)"
    ws["A4"].font = FONT_H
    style_header_row(ws, 5, ["Metric", "Value", "Formula source"])
    kpis = [
        ("Total tasks", '=COUNTA(\'S03_ALL_1000_Sprint_Tasks\'!M4:M2000)', "S03 Sub Task ID"),
        ("Done", '=COUNTIF(\'S03_ALL_1000_Sprint_Tasks\'!AO4:AO2000,"Done")', "Overall Status"),
        ("In Progress", '=COUNTIF(\'S03_ALL_1000_Sprint_Tasks\'!AO4:AO2000,"In Progress")', "Overall Status"),
        ("Not Started", '=COUNTIF(\'S03_ALL_1000_Sprint_Tasks\'!AO4:AO2000,"Not Started")', "Overall Status"),
        ("Blocked", '=COUNTIF(\'S03_ALL_1000_Sprint_Tasks\'!AO4:AO2000,"Blocked")', "Overall Status"),
        ("Deferred", '=COUNTIF(\'S03_ALL_1000_Sprint_Tasks\'!AO4:AO2000,"Deferred")', "Overall Status"),
        ("% Complete (Done / Total)", '=IF(B6=0,"",B7/B6)', "Done ÷ Total"),
    ]
    # Fix KPI rows - B6 is total at row 6
    # Row 6 = Total, 7=Done, ... 12=% 
    for i, (name, formula, src) in enumerate(kpis):
        r = 6 + i
        ws.cell(r, 1, value=name).border = THIN
        cell = ws.cell(r, 2, value=formula)
        cell.border = THIN
        cell.fill = FILLS["gold"]
        if "Complete" in name:
            cell.number_format = "0.0%"
            cell.fill = FILLS["ok"]
        ws.cell(r, 3, value=src).border = THIN
        ws.cell(r, 3).font = FONT_S

    # Fix % formula to use correct cells: Total=B6, Done=B7
    ws["B12"] = '=IF(B6=0,"",B7/B6)'
    ws["B12"].number_format = "0.0%"
    ws["B12"].fill = FILLS["ok"]
    ws["B12"].border = THIN

    # Data for pie chart (Overall status) — labels in E6:E11, values F6:F11
    ws["E5"] = "Chart data — Overall Status"
    ws["E5"].font = FONT_H
    style_header_row(ws, 5, ["Status", "Count"], start_col=5)
    # overwrite E5 conflict - put chart data at E6
    for i, st in enumerate(["Done", "In Progress", "Not Started", "Blocked", "Deferred", "N/A"]):
        r = 6 + i
        ws.cell(r, 5, value=st).border = THIN
        ws.cell(r, 6, value=f'=COUNTIF(\'S03_ALL_1000_Sprint_Tasks\'!AO4:AO2000,"{st}")').border = THIN
        ws.cell(r, 6).fill = FILLS["blue"]

    pie = PieChart()
    pie.title = "Overall Status Mix"
    labels = Reference(ws, min_col=5, min_row=6, max_row=11)
    data = Reference(ws, min_col=6, min_row=5, max_row=11)
    pie.add_data(data, titles_from_data=True)
    pie.set_categories(labels)
    pie.dataLabels = DataLabelList()
    pie.dataLabels.showPercent = True
    pie.dataLabels.showVal = False
    pie.dataLabels.showCatName = False
    pie.width = 12
    pie.height = 8
    ws.add_chart(pie, "H4")

    # ----- By Sprint -----
    ws["A14"] = "BY SPRINT WEEK"
    ws["A14"].font = FONT_H
    style_header_row(
        ws,
        15,
        ["Sprint", "Sheet", "Total", "Done", "In Progress", "Not Started", "Blocked", "% Done"],
    )
    weeks = [
        ("S1", "S1_Week1", 9),  # Track col I for S1
        ("S2", "S2_Week2", 8),
        ("S3", "S3_Week3", 8),
        ("S4", "S4_Week4", 8),
        ("S5", "S5_Week5", 8),
    ]
    for i, (sid, sheet, _tc) in enumerate(weeks):
        r = 16 + i
        ws.cell(r, 1, value=sid).border = THIN
        ws.cell(r, 2, value=sheet).border = THIN
        ws.cell(r, 3, value=f"=COUNTA('{sheet}'!M4:M2000)").border = THIN
        ws.cell(r, 4, value=f"=COUNTIF('{sheet}'!AO4:AO2000,\"Done\")").border = THIN
        ws.cell(r, 5, value=f"=COUNTIF('{sheet}'!AO4:AO2000,\"In Progress\")").border = THIN
        ws.cell(r, 6, value=f"=COUNTIF('{sheet}'!AO4:AO2000,\"Not Started\")").border = THIN
        ws.cell(r, 7, value=f"=COUNTIF('{sheet}'!AO4:AO2000,\"Blocked\")").border = THIN
        cell = ws.cell(r, 8, value=f"=IF(C{r}=0,\"\",D{r}/C{r})")
        cell.number_format = "0.0%"
        cell.border = THIN
        cell.fill = FILLS["ok"]

    bar_sprint = BarChart()
    bar_sprint.type = "col"
    bar_sprint.title = "% Done by Sprint"
    bar_sprint.y_axis.title = "% Done"
    data = Reference(ws, min_col=8, min_row=15, max_row=20)
    cats = Reference(ws, min_col=1, min_row=16, max_row=20)
    bar_sprint.add_data(data, titles_from_data=True)
    bar_sprint.set_categories(cats)
    bar_sprint.shape = 4
    bar_sprint.width = 12
    bar_sprint.height = 8
    ws.add_chart(bar_sprint, "J14")

    # ----- Work Bifurcation (main ask) -----
    # Find Work Bifurcation column letter on S03 dynamically later — assume we just added it;
    # use INDEX match via COUNTIFS on column - we'll store letter in a known place.
    # After add_bifurcation, S03 last headers — detect:
    s03 = wb["S03_ALL_1000_Sprint_Tasks"]
    bif_col = None
    for c in s03[3]:
        if c.value == "Work Bifurcation":
            bif_col = get_column_letter(c.column)
            break
    if not bif_col:
        bif_col = "AT"  # fallback guess

    ws["A23"] = "WORK BIFURCATION — UI / Web Frontend / Web UI / API / Mobile UI / Mobile Frontend / QA / …"
    ws["A23"].font = FONT_H
    ws.merge_cells("A23:I23")
    ws["A24"] = (
        f"Counts use S03 column {bif_col} (Work Bifurcation) × Overall Status (AO). "
        "Each task belongs to exactly one bifurcation bucket."
    )
    ws["A24"].font = FONT_S

    style_header_row(
        ws,
        25,
        ["Work Bifurcation", "Total", "Done", "In Progress", "Not Started", "Blocked", "Deferred", "% Complete"],
    )

    for i, cat in enumerate(CATEGORIES):
        r = 26 + i
        ws.cell(r, 1, value=cat).border = THIN
        if i % 2:
            ws.cell(r, 1).fill = FILLS["alt"]
        # COUNTIFS bifurcation + status
        ws.cell(
            r,
            2,
            value=f"=COUNTIF('S03_ALL_1000_Sprint_Tasks'!{bif_col}4:{bif_col}2000,A{r})",
        ).border = THIN
        for j, st in enumerate(["Done", "In Progress", "Not Started", "Blocked", "Deferred"]):
            col = 3 + j
            ws.cell(
                r,
                col,
                value=(
                    f"=COUNTIFS('S03_ALL_1000_Sprint_Tasks'!{bif_col}4:{bif_col}2000,A{r},"
                    f"'S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,\"{st}\")"
                ),
            ).border = THIN
        cell = ws.cell(r, 8, value=f"=IF(B{r}=0,\"\",C{r}/B{r})")
        cell.number_format = "0.0%"
        cell.border = THIN
        cell.fill = FILLS["ok"]

    last_cat_row = 25 + len(CATEGORIES)

    # Data bars on % complete
    ws.conditional_formatting.add(
        f"H26:H{last_cat_row}",
        DataBarRule(start_type="num", start_value=0, end_type="num", end_value=1, color="27AE60"),
    )

    bar_cat = BarChart()
    bar_cat.type = "bar"
    bar_cat.title = "% Complete by Work Bifurcation"
    bar_cat.style = 10
    data = Reference(ws, min_col=8, min_row=25, max_row=last_cat_row)
    cats = Reference(ws, min_col=1, min_row=26, max_row=last_cat_row)
    bar_cat.add_data(data, titles_from_data=True)
    bar_cat.set_categories(cats)
    bar_cat.width = 18
    bar_cat.height = 12
    ws.add_chart(bar_cat, "J23")

    # Stacked status by category chart data is already in C–G; create stacked bar
    bar_stack = BarChart()
    bar_stack.type = "col"
    bar_stack.grouping = "stacked"
    bar_stack.title = "Status stack by Bifurcation (Done / WIP / Not Started / …)"
    data = Reference(ws, min_col=3, min_row=25, max_col=7, max_row=last_cat_row)
    cats = Reference(ws, min_col=1, min_row=26, max_row=last_cat_row)
    bar_stack.add_data(data, titles_from_data=True)
    bar_stack.set_categories(cats)
    bar_stack.width = 18
    bar_stack.height = 10
    ws.add_chart(bar_stack, "J40")

    # ----- By classic Track (Web / UI / Mobile / QA) -----
    track_start = last_cat_row + 3
    ws.cell(track_start, 1, value="BY TRACK (Web / UI / Mobile / QA)").font = FONT_H
    style_header_row(
        ws,
        track_start + 1,
        ["Track", "Total", "Done", "In Progress", "Not Started", "% Complete"],
    )
    # S03 Track is column H
    for i, tr in enumerate(["UI", "Web", "Mobile", "QA"]):
        r = track_start + 2 + i
        ws.cell(r, 1, value=tr).border = THIN
        ws.cell(r, 2, value=f"=COUNTIF('S03_ALL_1000_Sprint_Tasks'!H4:H2000,A{r})").border = THIN
        ws.cell(
            r,
            3,
            value=f"=COUNTIFS('S03_ALL_1000_Sprint_Tasks'!H4:H2000,A{r},'S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,\"Done\")",
        ).border = THIN
        ws.cell(
            r,
            4,
            value=f"=COUNTIFS('S03_ALL_1000_Sprint_Tasks'!H4:H2000,A{r},'S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,\"In Progress\")",
        ).border = THIN
        ws.cell(
            r,
            5,
            value=f"=COUNTIFS('S03_ALL_1000_Sprint_Tasks'!H4:H2000,A{r},'S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,\"Not Started\")",
        ).border = THIN
        cell = ws.cell(r, 6, value=f"=IF(B{r}=0,\"\",C{r}/B{r})")
        cell.number_format = "0.0%"
        cell.border = THIN
        cell.fill = FILLS["ok"]

    # ----- How to use -----
    help_r = track_start + 8
    ws.cell(help_r, 1, value="HOW TO TRACK (goal = easy)").font = FONT_H
    tips = [
        "1) Developer changes yellow Status on S1_Week1…S5_Week5 only.",
        "2) Module sheets + S03_ALL update live (light blue / linked).",
        "3) This Sprint Dashboard and Main 08_Dashboard recalculate % Complete.",
        "4) Filter S03_ALL by Work Bifurcation = 'Mobile UI' (or QA, API…) to see that lane’s backlog.",
        "5) Purple Work Bifurcation column = category for charts above.",
        "6) Ultimate view: Overall % (cell B12) + bifurcation table + charts.",
    ]
    for i, t in enumerate(tips):
        ws.cell(help_r + 1 + i, 1, value=t).font = FONT_N

    for col, w in enumerate([26, 10, 10, 12, 12, 10, 10, 12, 12, 12, 12, 12], 1):
        ws.column_dimensions[get_column_letter(col)].width = w

    print(f"S02 rebuilt; bifurcation col on S03 = {bif_col}")
    return bif_col


def enhance_08_dashboard(wb, bif_col: str):
    """Add bifurcation + % + charts to main 08_Dashboard without removing existing live block."""
    ws = wb["08_Dashboard"]

    # Clear previous appended bifurcation block if re-run (rows 58+)
    for m in list(ws.merged_cells.ranges):
        if m.min_row >= 58:
            try:
                ws.unmerge_cells(str(m))
            except Exception:
                pass
    for r in range(58, min(ws.max_row + 1, 1200)):
        for c in range(1, 20):
            cell = ws.cell(r, c)
            if type(cell).__name__ == "MergedCell":
                continue
            cell.value = None
            try:
                cell.fill = PatternFill(fill_type=None)
            except Exception:
                pass
    # Drop previous bifurcation charts; keep sheet clean then add fresh ones
    ws._charts = []

    start = 58

    ws.cell(start, 1, value="═══════════════════════════════════════════════════════════════").font = FONT_S
    ws.cell(start + 1, 1, value="WORK BIFURCATION TRACKING (UI / Web UI / Web Frontend / API / Mobile / QA / …)").font = FONT_T
    ws.merge_cells(start_row=start + 1, start_column=1, end_row=start + 1, end_column=8)
    ws.cell(
        start + 2,
        1,
        value=(
            "Same live pipeline: Week sheet Status → Modules → T_MASTER (above) AND S03 Work Bifurcation (below). "
            "Edit Status on S1–S5 only. See also S02_Sprint_Dashboard for sprint charts."
        ),
    ).fill = FILLS["warn"]
    ws.merge_cells(start_row=start + 2, start_column=1, end_row=start + 2, end_column=8)

    # Overall % highlight box
    r0 = start + 4
    ws.cell(r0, 1, value="Overall % Complete (all tasks)").font = FONT_H
    ws.cell(
        r0,
        2,
        value='=IF(COUNTA(\'S03_ALL_1000_Sprint_Tasks\'!M4:M2000)=0,"",COUNTIF(\'S03_ALL_1000_Sprint_Tasks\'!AO4:AO2000,"Done")/COUNTA(\'S03_ALL_1000_Sprint_Tasks\'!M4:M2000))',
    )
    ws.cell(r0, 2).number_format = "0.0%"
    ws.cell(r0, 2).fill = FILLS["ok"]
    ws.cell(r0, 2).font = Font(name="Calibri", bold=True, size=14, color="1B3A4B")
    ws.cell(r0, 2).border = THIN

    # Status summary
    r1 = start + 6
    style_header_row(ws, r1, ["Overall Status", "Count", "% of Total"])
    for i, st in enumerate(STATUSES):
        r = r1 + 1 + i
        ws.cell(r, 1, value=st).border = THIN
        ws.cell(r, 2, value=f"=COUNTIF('S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,A{r})").border = THIN
        cell = ws.cell(
            r,
            3,
            value=f"=IF(COUNTA('S03_ALL_1000_Sprint_Tasks'!M4:M2000)=0,\"\",B{r}/COUNTA('S03_ALL_1000_Sprint_Tasks'!M4:M2000))",
        )
        cell.number_format = "0.0%"
        cell.border = THIN

    pie = PieChart()
    pie.title = "Main Dashboard — Overall Status"
    labels = Reference(ws, min_col=1, min_row=r1 + 1, max_row=r1 + len(STATUSES))
    data = Reference(ws, min_col=2, min_row=r1, max_row=r1 + len(STATUSES))
    pie.add_data(data, titles_from_data=True)
    pie.set_categories(labels)
    pie.dataLabels = DataLabelList()
    pie.dataLabels.showPercent = True
    pie.width = 12
    pie.height = 8
    ws.add_chart(pie, "E" + str(r1))

    # Bifurcation table
    r2 = r1 + len(STATUSES) + 3
    ws.cell(r2, 1, value="By Work Bifurcation — Complete / In Progress / Not Started").font = FONT_H
    style_header_row(
        ws,
        r2 + 1,
        ["Work Bifurcation", "Total", "Done", "In Progress", "Not Started", "Blocked", "% Complete"],
    )
    for i, cat in enumerate(CATEGORIES):
        r = r2 + 2 + i
        ws.cell(r, 1, value=cat).border = THIN
        ws.cell(r, 2, value=f"=COUNTIF('S03_ALL_1000_Sprint_Tasks'!{bif_col}4:{bif_col}2000,A{r})").border = THIN
        for j, st in enumerate(["Done", "In Progress", "Not Started", "Blocked"]):
            ws.cell(
                r,
                3 + j,
                value=(
                    f"=COUNTIFS('S03_ALL_1000_Sprint_Tasks'!{bif_col}4:{bif_col}2000,A{r},"
                    f"'S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,\"{st}\")"
                ),
            ).border = THIN
        cell = ws.cell(r, 7, value=f"=IF(B{r}=0,\"\",C{r}/B{r})")
        cell.number_format = "0.0%"
        cell.border = THIN
        cell.fill = FILLS["ok"]

    cat_end = r2 + 1 + len(CATEGORIES)
    ws.conditional_formatting.add(
        f"G{r2+2}:G{cat_end}",
        DataBarRule(start_type="num", start_value=0, end_type="num", end_value=1, color="2980B9"),
    )

    bar = BarChart()
    bar.type = "bar"
    bar.title = "% Complete by Bifurcation (Main Dashboard)"
    data = Reference(ws, min_col=7, min_row=r2 + 1, max_row=cat_end)
    cats = Reference(ws, min_col=1, min_row=r2 + 2, max_row=cat_end)
    bar.add_data(data, titles_from_data=True)
    bar.set_categories(cats)
    bar.width = 16
    bar.height = 12
    ws.add_chart(bar, "I" + str(r2))

    # Track quick view using T_MASTER
    r3 = cat_end + 3
    ws.cell(r3, 1, value="By Track (from T_MASTER — also live)").font = FONT_H
    style_header_row(ws, r3 + 1, ["Track", "Total", "Done", "% Complete"])
    for i, tr in enumerate(["UI", "Web", "Mobile", "QA"]):
        r = r3 + 2 + i
        ws.cell(r, 1, value=tr).border = THIN
        ws.cell(r, 2, value=f"=COUNTIF(T_MASTER[Track],A{r})").border = THIN
        ws.cell(r, 3, value=f'=COUNTIFS(T_MASTER[Track],A{r},T_MASTER[Overall Status],"Done")').border = THIN
        cell = ws.cell(r, 4, value=f"=IF(B{r}=0,\"\",C{r}/B{r})")
        cell.number_format = "0.0%"
        cell.border = THIN
        cell.fill = FILLS["ok"]

    # Update A1 banner
    ws["A1"] = (
        "LIVE MAIN DASHBOARD — T_MASTER ← Modules ← Week Status. "
        "Scroll to row 58 for Work Bifurcation + % + charts. Also open S02_Sprint_Dashboard. "
        "Edit yellow Status on S1–S5 only; Calculate Now if needed."
    )

    print(f"08_Dashboard enhanced from row {start}")


def update_guides(wb):
    if "S00_Sprint_Cover" in wb.sheetnames:
        ws = wb["S00_Sprint_Cover"]
        ws["A24"] = (
            "TRACKING: Open S02_Sprint_Dashboard for charts + UI/Web/API/Mobile/QA bifurcation % . "
            "Open 08_Dashboard for main product %. Purple column Work Bifurcation on S03/week/module sheets."
        )
        ws["A24"].fill = FILLS["ok"]
        ws["A24"].font = FONT_H
    if "S00_How_To_Execute" in wb.sheetnames:
        ws = wb["S00_How_To_Execute"]
        ws["A16"] = (
            "Easy tracking: S02_Sprint_Dashboard + 08_Dashboard show % Complete by UI, Web Frontend, "
            "API, Mobile UI, Mobile Frontend, QA. Filter S03 by Work Bifurcation."
        )
        ws["A16"].fill = FILLS["gold"]


def print_category_counts(meta):
    from collections import Counter
    c = Counter(v["category"] for v in meta.values())
    print("Category distribution:")
    for k in CATEGORIES:
        print(f"  {k}: {c.get(k, 0)}")
    print("  TOTAL", sum(c.values()))


def main():
    if not TARGET.exists():
        raise SystemExit(f"Missing {TARGET}")

    backup = TARGET.with_name(
        TARGET.stem + f"_backup_before_dashboards_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )
    shutil.copy2(TARGET, backup)
    print("Backup:", backup)

    wb = load_workbook(TARGET)
    meta = load_module_meta(wb)
    print("Meta rows:", len(meta))
    assert len(meta) == 1000
    print_category_counts(meta)

    add_bifurcation_column(wb, meta)
    bif_col = None
    for c in wb["S03_ALL_1000_Sprint_Tasks"][3]:
        if c.value == "Work Bifurcation":
            bif_col = get_column_letter(c.column)
            break
    assert bif_col, "Work Bifurcation column missing on S03"

    rebuild_s02(wb)
    # rebuild_s02 may need bif_col again after recreate — re-read
    for c in wb["S03_ALL_1000_Sprint_Tasks"][3]:
        if c.value == "Work Bifurcation":
            bif_col = get_column_letter(c.column)
            break

    # Patch S02 formulas if rebuild used wrong col — rebuild already detects from S03
    enhance_08_dashboard(wb, bif_col)
    update_guides(wb)

    wb.save(TARGET)
    print("Saved:", TARGET)
    print("Open S02_Sprint_Dashboard and 08_Dashboard — enable charts; Calculate Now.")


if __name__ == "__main__":
    main()
