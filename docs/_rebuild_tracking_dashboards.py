#!/usr/bin/env python3
"""
Rebuild easy tracking dashboards with SEPARATE work-lane bifurcation:

  UI | Web Frontend | Web UI | Web API | API Mobile | Mobile UI | Mobile Frontend |
  Mobile UX | QA | Database | Security | Integration | Web Other | Other

- Reclassify Work Bifurcation on S1–S5, S03_ALL, and module sheets
- Rebuild S02_Sprint_Dashboard (tables + % + charts)
- Enhance 08_Dashboard bifurcation section (same lanes, live formulas)

Status still flows: Week yellow Status → Modules → MASTER → Dashboard
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
    "purple": PatternFill("solid", fgColor="E8DAEF"),
    "warn": PatternFill("solid", fgColor="FDEBD0"),
    "ok": PatternFill("solid", fgColor="D5F5E3"),
    "blue": PatternFill("solid", fgColor="D6EAF8"),
    "alt": PatternFill("solid", fgColor="F8F9F9"),
    "title": PatternFill("solid", fgColor="154360"),
}
FONT_W = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
FONT_T = Font(name="Calibri", bold=True, color="1B3A4B", size=16)
FONT_H = Font(name="Calibri", bold=True, color="1B3A4B", size=12)
FONT_N = Font(name="Calibri", size=10, color="1C2833")
FONT_S = Font(name="Calibri", size=9, color="5D6D7E")

# Exact lane names used in dashboards (order matters for charts)
LANES = [
    "UI",
    "Web Frontend",
    "Web UI",
    "Web API",
    "API Mobile",
    "Mobile UI",
    "Mobile Frontend",
    "QA",
    "Database",
    "Security",
    "Integration",
    "Web Other",
    "Other",
]

WEEK_SHEETS = ["S1_Week1", "S2_Week2", "S3_Week3", "S4_Week4", "S5_Week5"]


def classify(track: str, layer: str, sub: str = "", surface: str = "") -> str:
    """Map Track + Layer (+ hints) → one Work Bifurcation lane."""
    t = (track or "").strip()
    ly = (layer or "").strip()
    ly_l = ly.lower()
    s = (sub or "").lower()
    surf = (surface or "").lower()

    if t == "QA" or ly == "QA" or s.startswith("qa:") or s.startswith("regression"):
        return "QA"

    if t == "UI":
        # Split UI track into UI / Web Frontend / Web UI for separate dashboard rows
        if (
            "website" in surf
            or surf.strip() in ("public", "patient")
            or "public" in surf
            or "patient website" in surf
            or "patient app" in surf
            or "landing" in s
            or "home page" in s
        ):
            return "Web UI"
        if any(x in surf for x in ("reception", "account", "pharmacy", "shared", "all")):
            return "Web Frontend"
        # Doctor / Admin clinical portals
        return "UI"

    if t == "Mobile" or "mobile" in ly_l:
        if ly == "Mobile UI" or ly_l == "mobile ui":
            return "Mobile UI"
        if ly == "Mobile UX" or ly_l == "mobile ux":
            # UX polish on mobile = Mobile Frontend lane (matches team wording)
            return "Mobile Frontend"
        if ly == "Mobile client" or ly_l == "mobile client":
            return "API Mobile"
        if "wire to" in s and "api" in s:
            return "API Mobile"
        return "Mobile Frontend"

    if t == "Web":
        if "database" in ly_l:
            return "Database"
        if "security" in ly_l:
            return "Security"
        if "integration" in ly_l:
            return "Integration"
        if ly_l.startswith("api") or ly in ("API", "API hygiene", "API contract", "API + SPA", "Backend"):
            return "Web API"
        if ly in ("Web SPA",) or "spa" in ly_l:
            return "Web Frontend"
        if ly in ("Design",) or s.startswith("ui:"):
            return "Web UI"
        if ly in ("Architecture", "Decision", "Legal", "Configuration"):
            return "Web Other"
        if "website" in surf:
            return "Web Frontend"
        if "portal" in surf:
            return "Web Frontend"
        # Remaining Web-track work treated as Web Frontend for tracking visibility
        return "Web Frontend"

    return "Other"


def style_header_row(ws, row, cols, fill=None):
    fill = fill or FILLS["header"]
    for c in range(1, cols + 1):
        cell = ws.cell(row=row, column=c)
        if cell.value is None:
            continue
        cell.fill = fill
        cell.font = FONT_W
        cell.alignment = CENTER
        cell.border = THIN


def set_widths(ws, widths):
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w


def load_module_meta(wb):
    """sub_id -> track, layer, sub, surface"""
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
                "sub": str(ws.cell(r, 12).value or ""),
                "surface": str(ws.cell(r, 18).value or ""),
                "sheet": sn,
                "row": r,
            }
    return meta


def ensure_bifurcation_header(ws, header_row: int) -> int:
    headers = {str(c.value).strip(): c.column for c in ws[header_row] if c.value}
    if "Work Bifurcation" in headers:
        return headers["Work Bifurcation"]
    col = max(headers.values()) + 1 if headers else 46
    cell = ws.cell(row=header_row, column=col, value="Work Bifurcation")
    cell.fill = PatternFill("solid", fgColor="6C3483")
    cell.font = FONT_W
    cell.alignment = CENTER
    cell.border = THIN
    ws.column_dimensions[get_column_letter(col)].width = 18
    return col


def apply_bifurcation(wb, meta):
    """Write Work Bifurcation on modules + all sprint sheets."""
    # Modules — add/update column
    for sn in wb.sheetnames:
        if not (sn.startswith("M") and sn[1].isdigit()):
            continue
        ws = wb[sn]
        col = ensure_bifurcation_header(ws, 2)
        for r in range(3, ws.max_row + 1):
            sid = ws.cell(r, 11).value
            if not sid:
                continue
            m = meta.get(str(sid).strip())
            if not m:
                continue
            lane = classify(m["track"], m["layer"], m["sub"], m["surface"])
            cell = ws.cell(r, col, value=lane)
            cell.fill = FILLS["purple"]
            cell.font = FONT_N
            cell.border = THIN
            cell.alignment = CENTER

    # Sprint sheets (week + S03)
    sprint_sheets = WEEK_SHEETS + (["S03_ALL_1000_Sprint_Tasks"] if "S03_ALL_1000_Sprint_Tasks" in wb.sheetnames else [])
    counts = {k: 0 for k in LANES}
    for sn in sprint_sheets:
        ws = wb[sn]
        header_row = 3
        # find Sub Task ID col
        headers = {str(c.value).strip(): c.column for c in ws[header_row] if c.value}
        sid_col = headers.get("Sub Task ID", 13)
        track_col = headers.get("Track", 8)
        bif_col = ensure_bifurcation_header(ws, header_row)
        for r in range(header_row + 1, ws.max_row + 1):
            sid = ws.cell(r, sid_col).value
            if not sid:
                continue
            sid = str(sid).strip()
            m = meta.get(sid)
            if m:
                lane = classify(m["track"], m["layer"], m["sub"], m["surface"])
            else:
                # fallback track only
                lane = classify(str(ws.cell(r, track_col).value or ""), "", "", "")
            cell = ws.cell(r, bif_col, value=lane)
            cell.fill = FILLS["purple"]
            cell.font = FONT_N
            cell.border = THIN
            cell.alignment = CENTER
            if sn == "S03_ALL_1000_Sprint_Tasks":
                counts[lane] = counts.get(lane, 0) + 1
    return counts


def countifs_lane_status(lane_cell: str, status: str) -> str:
    """lane_cell like A26 referencing lane name; status literal."""
    return (
        f"=COUNTIFS('S03_ALL_1000_Sprint_Tasks'!$AT$4:$AT$2000,{lane_cell},"
        f"'S03_ALL_1000_Sprint_Tasks'!$AO$4:$AO$2000,\"{status}\")"
    )


def rebuild_s02(wb):
    if "S02_Sprint_Dashboard" in wb.sheetnames:
        del wb["S02_Sprint_Dashboard"]
    idx = wb.sheetnames.index("S01_Sprint_Calendar") + 1 if "S01_Sprint_Calendar" in wb.sheetnames else 12
    ws = wb.create_sheet("S02_Sprint_Dashboard", idx)

    # ---- Title ----
    ws["A1"] = "S02 — LIVE Sprint Tracking Dashboard (easy tracking by Work Lane)"
    ws["A1"].font = Font(name="Calibri", bold=True, color="FFFFFF", size=16)
    ws["A1"].fill = FILLS["title"]
    ws.merge_cells("A1:L1")
    ws["A2"] = (
        "Edit yellow Status on S1_Week1…S5_Week5 only → Modules + S03 + this dashboard + 08_Dashboard update. "
        "Purple Work Bifurcation = UI / Web Frontend / Web UI / Web API / API Mobile / Mobile UI / Mobile Frontend / QA / … "
        "Excel: Formulas → Calculate Now if numbers look stale."
    )
    ws["A2"].fill = FILLS["warn"]
    ws["A2"].alignment = WRAP
    ws.merge_cells("A2:L2")
    ws.row_dimensions[2].height = 36

    # ---- Overall KPIs ----
    ws["A4"] = "① OVERALL % (all tasks)"
    ws["A4"].font = FONT_H
    headers = ["Metric", "Value"]
    for c, h in enumerate(headers, 1):
        cell = ws.cell(5, c, value=h)
        cell.fill = FILLS["header"]
        cell.font = FONT_W
        cell.border = THIN
    metrics = [
        ("Total tasks", "=COUNTA('S03_ALL_1000_Sprint_Tasks'!M4:M2000)"),
        ("Done", "=COUNTIF('S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,\"Done\")"),
        ("In Progress", "=COUNTIF('S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,\"In Progress\")"),
        ("Not Started", "=COUNTIF('S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,\"Not Started\")"),
        ("Blocked", "=COUNTIF('S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,\"Blocked\")"),
        ("Deferred", "=COUNTIF('S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,\"Deferred\")"),
        ("N/A", "=COUNTIF('S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,\"N/A\")"),
        ("% Complete (Done÷Total)", "=IF(B6=0,\"\",B7/B6)"),
    ]
    for i, (name, formula) in enumerate(metrics):
        r = 6 + i
        ws.cell(r, 1, value=name).border = THIN
        cell = ws.cell(r, 2, value=formula)
        cell.border = THIN
        cell.fill = FILLS["gold"]
        if "Complete" in name:
            cell.number_format = "0.0%"
            cell.fill = FILLS["ok"]

    # Status pie data (E5:F12)
    ws["E5"] = "Status"
    ws["F5"] = "Count"
    style_header_row(ws, 5, 6)
    for i, st in enumerate(["Done", "In Progress", "Not Started", "Blocked", "Deferred", "N/A"]):
        r = 6 + i
        ws.cell(r, 5, value=st).border = THIN
        ws.cell(r, 6, value=f"=COUNTIF('S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,E{r})").border = THIN

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

    # ---- By Sprint ----
    ws["A16"] = "② BY SPRINT WEEK (Overall Status)"
    ws["A16"].font = FONT_H
    sprint_headers = ["Sprint", "Sheet", "Total", "Done", "In Progress", "Not Started", "Blocked", "Deferred", "% Complete"]
    for c, h in enumerate(sprint_headers, 1):
        cell = ws.cell(17, c, value=h)
        cell.fill = FILLS["header"]
        cell.font = FONT_W
        cell.border = THIN
    for i, (sid, sheet) in enumerate(
        [("S1", "S1_Week1"), ("S2", "S2_Week2"), ("S3", "S3_Week3"), ("S4", "S4_Week4"), ("S5", "S5_Week5")]
    ):
        r = 18 + i
        ws.cell(r, 1, value=sid).border = THIN
        ws.cell(r, 2, value=sheet).border = THIN
        ws.cell(r, 3, value=f"=COUNTA('{sheet}'!M4:M2000)").border = THIN
        for col, st in enumerate(["Done", "In Progress", "Not Started", "Blocked", "Deferred"], 4):
            ws.cell(r, col, value=f"=COUNTIF('{sheet}'!AO4:AO2000,\"{st}\")").border = THIN
        cell = ws.cell(r, 9, value=f"=IF(C{r}=0,\"\",D{r}/C{r})")
        cell.number_format = "0.0%"
        cell.border = THIN
        cell.fill = FILLS["ok"]

    # % Done by sprint chart
    bar1 = BarChart()
    bar1.type = "col"
    bar1.title = "% Complete by Sprint"
    bar1.y_axis.title = "% Done"
    data = Reference(ws, min_col=9, min_row=17, max_row=22)
    cats = Reference(ws, min_col=1, min_row=18, max_row=22)
    bar1.add_data(data, titles_from_data=True)
    bar1.set_categories(cats)
    bar1.shape = 4
    bar1.width = 12
    bar1.height = 8
    ws.add_chart(bar1, "H16")

    # ---- Work Bifurcation master table ----
    ws["A25"] = "③ WORK BIFURCATION — SEPARATE lanes (UI, Web Frontend, Web UI, Web API, API Mobile, Mobile UI, Mobile Frontend, QA, …)"
    ws["A25"].font = FONT_H
    ws.merge_cells("A25:J25")
    ws["A26"] = "Each row = one work type. Status columns show Done / In Progress / Not Started / Blocked / Deferred / N/A + % Complete. Live from S03 (linked to week sheets)."
    ws["A26"].font = FONT_S
    ws.merge_cells("A26:J26")

    bif_headers = [
        "Work Bifurcation",
        "Total",
        "Done",
        "In Progress",
        "Not Started",
        "Blocked",
        "Deferred",
        "N/A",
        "% Complete",
    ]
    for c, h in enumerate(bif_headers, 1):
        cell = ws.cell(27, c, value=h)
        cell.fill = PatternFill("solid", fgColor="6C3483")
        cell.font = FONT_W
        cell.border = THIN

    for i, lane in enumerate(LANES):
        r = 28 + i
        ws.cell(r, 1, value=lane).border = THIN
        ws.cell(r, 1).fill = FILLS["purple"]
        ws.cell(r, 2, value=f"=COUNTIF('S03_ALL_1000_Sprint_Tasks'!$AT$4:$AT$2000,A{r})").border = THIN
        for col, st in enumerate(["Done", "In Progress", "Not Started", "Blocked", "Deferred", "N/A"], 3):
            ws.cell(r, col, value=countifs_lane_status(f"A{r}", st)).border = THIN
        cell = ws.cell(r, 9, value=f"=IF(B{r}=0,\"\",C{r}/B{r})")
        cell.number_format = "0.0%"
        cell.border = THIN
        cell.fill = FILLS["ok"]

    last_lane_row = 28 + len(LANES) - 1  # 41

    # % Complete by bifurcation bar
    bar2 = BarChart()
    bar2.type = "bar"
    bar2.title = "% Complete by Work Bifurcation"
    data = Reference(ws, min_col=9, min_row=27, max_row=last_lane_row)
    cats = Reference(ws, min_col=1, min_row=28, max_row=last_lane_row)
    bar2.add_data(data, titles_from_data=True)
    bar2.set_categories(cats)
    bar2.width = 18
    bar2.height = 12
    ws.add_chart(bar2, "K27")

    # Stacked status by bifurcation
    bar3 = BarChart()
    bar3.type = "col"
    bar3.grouping = "stacked"
    bar3.title = "Status stack by Bifurcation (Done / WIP / Not Started / …)"
    data = Reference(ws, min_col=3, max_col=7, min_row=27, max_row=last_lane_row)
    cats = Reference(ws, min_col=1, min_row=28, max_row=last_lane_row)
    bar3.add_data(data, titles_from_data=True)
    bar3.set_categories(cats)
    bar3.width = 18
    bar3.height = 10
    ws.add_chart(bar3, "K45")

    # ---- Separate detail blocks per major lane ----
    start = last_lane_row + 3  # 44
    ws.cell(start, 1, value="④ SEPARATE STATUS PANEL — one block per Work Lane (easy tracking)").font = FONT_H
    ws.merge_cells(start_row=start, start_column=1, end_row=start, end_column=6)

    # Major lanes get a compact KPI strip
    major = [
        "UI",
        "Web Frontend",
        "Web UI",
        "Web API",
        "API Mobile",
        "Mobile UI",
        "Mobile Frontend",
        "QA",
        "Database",
        "Security",
        "Integration",
    ]
    r = start + 2
    for lane in major:
        ws.cell(r, 1, value=lane).fill = FILLS["purple"]
        ws.cell(r, 1).font = FONT_H
        ws.cell(r, 1).border = THIN
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=6)
        r += 1
        for c, h in enumerate(["Status", "Count", "% of this lane"], 1):
            cell = ws.cell(r, c, value=h)
            cell.fill = FILLS["header"]
            cell.font = FONT_W
            cell.border = THIN
        header_r = r
        r += 1
        block_start = r
        for st in ["Done", "In Progress", "Not Started", "Blocked", "Deferred", "N/A"]:
            ws.cell(r, 1, value=st).border = THIN
            # COUNTIFS lane + status
            ws.cell(
                r,
                2,
                value=(
                    f"=COUNTIFS('S03_ALL_1000_Sprint_Tasks'!$AT$4:$AT$2000,\"{lane}\","
                    f"'S03_ALL_1000_Sprint_Tasks'!$AO$4:$AO$2000,A{r})"
                ),
            ).border = THIN
            cell = ws.cell(
                r,
                3,
                value=(
                    f"=IF(SUMIF($A${block_start}:$A${block_start+5},\"<>\",$B${block_start}:$B${block_start+5})=0,\"\","
                    f"B{r}/COUNTIF('S03_ALL_1000_Sprint_Tasks'!$AT$4:$AT$2000,\"{lane}\"))"
                ),
            )
            # simpler % of lane total:
            cell.value = f"=IF(COUNTIF('S03_ALL_1000_Sprint_Tasks'!$AT$4:$AT$2000,\"{lane}\")=0,\"\",B{r}/COUNTIF('S03_ALL_1000_Sprint_Tasks'!$AT$4:$AT$2000,\"{lane}\"))"
            cell.number_format = "0.0%"
            cell.border = THIN
            r += 1
        # % complete highlight
        ws.cell(r, 1, value="% Complete (Done)").border = THIN
        ws.cell(r, 1).fill = FILLS["ok"]
        cell = ws.cell(
            r,
            2,
            value=(
                f"=IF(COUNTIF('S03_ALL_1000_Sprint_Tasks'!$AT$4:$AT$2000,\"{lane}\")=0,\"\","
                f"COUNTIFS('S03_ALL_1000_Sprint_Tasks'!$AT$4:$AT$2000,\"{lane}\","
                f"'S03_ALL_1000_Sprint_Tasks'!$AO$4:$AO$2000,\"Done\")/"
                f"COUNTIF('S03_ALL_1000_Sprint_Tasks'!$AT$4:$AT$2000,\"{lane}\"))"
            ),
        )
        cell.number_format = "0.0%"
        cell.fill = FILLS["ok"]
        cell.border = THIN
        r += 2

    # ---- By classic Track ----
    ws.cell(r, 1, value="⑤ BY CLASSIC TRACK (Web / UI / Mobile / QA)").font = FONT_H
    r += 1
    for c, h in enumerate(["Track", "Total", "Done", "In Progress", "Not Started", "% Complete"], 1):
        cell = ws.cell(r, c, value=h)
        cell.fill = FILLS["header"]
        cell.font = FONT_W
        cell.border = THIN
    track_header = r
    r += 1
    for tr in ["UI", "Web", "Mobile", "QA"]:
        ws.cell(r, 1, value=tr).border = THIN
        # S03 Track is column H
        ws.cell(r, 2, value=f"=COUNTIF('S03_ALL_1000_Sprint_Tasks'!$H$4:$H$2000,A{r})").border = THIN
        for col, st in enumerate(["Done", "In Progress", "Not Started"], 3):
            ws.cell(
                r,
                col,
                value=(
                    f"=COUNTIFS('S03_ALL_1000_Sprint_Tasks'!$H$4:$H$2000,A{r},"
                    f"'S03_ALL_1000_Sprint_Tasks'!$AO$4:$AO$2000,\"{st}\")"
                ),
            ).border = THIN
        cell = ws.cell(r, 6, value=f"=IF(B{r}=0,\"\",C{r}/B{r})")
        cell.number_format = "0.0%"
        cell.border = THIN
        cell.fill = FILLS["ok"]
        r += 1

    r += 1
    ws.cell(r, 1, value="⑥ HOW TO TRACK (goal = easy)").font = FONT_H
    r += 1
    tips = [
        "1) Developer sets yellow Status on S1_Week1…S5_Week5 (source of truth).",
        "2) Module sheets + S03_ALL update live → Overall Status recalculates.",
        "3) Open THIS sheet (S02) for Sprint + Work-Lane % and charts.",
        "4) Open 08_Dashboard for whole-product Main Dashboard (same bifurcation).",
        "5) Filter S03_ALL column Work Bifurcation = e.g. 'Mobile UI' or 'Web API' to see the task list.",
        "6) Ultimate KPIs: Overall % (B13) + bifurcation table (rows 28+) + per-lane panels below.",
    ]
    for tip in tips:
        ws.cell(r, 1, value=tip).font = FONT_N
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=8)
        r += 1

    set_widths(ws, [28, 12, 14, 14, 14, 12, 12, 10, 12, 12, 12, 12])
    ws.freeze_panes = "A4"
    return ws


def enhance_main_dashboard(wb):
    ws = wb["08_Dashboard"]
    # Find or create bifurcation section starting ~58
    # Clear from row 58 onward content in cols A-J carefully — rewrite section
    # Keep rows 1-56 as existing integrity/module tables

    # Update title
    ws["A1"] = (
        "LIVE MAIN DASHBOARD — Week Status → Modules → T_MASTER. "
        "Scroll to WORK BIFURCATION for UI / Web Frontend / Web UI / Web API / API Mobile / Mobile UI / Mobile Frontend / QA % Complete."
    )
    ws["A1"].alignment = WRAP

    start = 58
    # Unmerge anything overlapping the rewrite zone, then clear
    to_unmerge = []
    for mr in list(ws.merged_cells.ranges):
        if mr.min_row >= 58:
            to_unmerge.append(str(mr))
    for mref in to_unmerge:
        try:
            ws.unmerge_cells(mref)
        except Exception:
            pass
    for r in range(58, 130):
        for c in range(1, 12):
            cell = ws.cell(r, c)
            try:
                cell.value = None
                cell.fill = PatternFill()
            except AttributeError:
                pass

    # Remove old charts beyond first ones? Keep existing 2 charts; add new if needed
    # We'll add charts only on S02 primarily; on 08 add one bar if space

    ws.cell(start, 1, value="══════════════════════════════════════════════════════════════════════")
    ws.cell(start + 1, 1, value="WORK BIFURCATION TRACKING — SEPARATE lanes + status + % Complete")
    ws.cell(start + 1, 1).font = FONT_H
    ws.cell(start + 2, 1, value="Live: S03 Work Bifurcation (AT) × Overall Status (AO). Same pipeline as sprint week edits.")
    ws.cell(start + 2, 1).font = FONT_S

    ws.cell(start + 4, 1, value="Overall % Complete (all tasks)")
    cell = ws.cell(
        start + 4,
        2,
        value="=IF(COUNTA('S03_ALL_1000_Sprint_Tasks'!M4:M2000)=0,\"\",COUNTIF('S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,\"Done\")/COUNTA('S03_ALL_1000_Sprint_Tasks'!M4:M2000))",
    )
    cell.number_format = "0.0%"
    cell.fill = FILLS["ok"]
    cell.font = FONT_H

    # Overall status mini
    r = start + 6
    ws.cell(r, 1, value="Overall Status")
    ws.cell(r, 2, value="Count")
    ws.cell(r, 3, value="% of Total")
    style_header_row(ws, r, 3)
    r += 1
    for st in ["Done", "In Progress", "Not Started", "Blocked", "Deferred", "N/A"]:
        ws.cell(r, 1, value=st).border = THIN
        ws.cell(r, 2, value=f"=COUNTIF('S03_ALL_1000_Sprint_Tasks'!AO4:AO2000,A{r})").border = THIN
        cell = ws.cell(r, 3, value=f"=IF(COUNTA('S03_ALL_1000_Sprint_Tasks'!M4:M2000)=0,\"\",B{r}/COUNTA('S03_ALL_1000_Sprint_Tasks'!M4:M2000))")
        cell.number_format = "0.0%"
        cell.border = THIN
        r += 1

    r += 1
    ws.cell(r, 1, value="By Work Bifurcation — Complete / In Progress / Not Started / … (SEPARATE for each lane)")
    ws.cell(r, 1).font = FONT_H
    r += 1
    headers = ["Work Bifurcation", "Total", "Done", "In Progress", "Not Started", "Blocked", "Deferred", "N/A", "% Complete"]
    for c, h in enumerate(headers, 1):
        cell = ws.cell(r, c, value=h)
        cell.fill = PatternFill("solid", fgColor="6C3483")
        cell.font = FONT_W
        cell.border = THIN
    header_r = r
    r += 1
    first_lane = r
    for lane in LANES:
        ws.cell(r, 1, value=lane).border = THIN
        ws.cell(r, 1).fill = FILLS["purple"]
        ws.cell(r, 2, value=f"=COUNTIF('S03_ALL_1000_Sprint_Tasks'!$AT$4:$AT$2000,A{r})").border = THIN
        for col, st in enumerate(["Done", "In Progress", "Not Started", "Blocked", "Deferred", "N/A"], 3):
            ws.cell(r, col, value=countifs_lane_status(f"A{r}", st)).border = THIN
        cell = ws.cell(r, 9, value=f"=IF(B{r}=0,\"\",C{r}/B{r})")
        cell.number_format = "0.0%"
        cell.border = THIN
        cell.fill = FILLS["ok"]
        r += 1
    last_lane = r - 1

    # Classic track table
    r += 2
    ws.cell(r, 1, value="By Track (T_MASTER — also live)").font = FONT_H
    r += 1
    for c, h in enumerate(["Track", "Total", "Done", "% Complete"], 1):
        cell = ws.cell(r, c, value=h)
        cell.fill = FILLS["header"]
        cell.font = FONT_W
        cell.border = THIN
    r += 1
    for tr in ["UI", "Web", "Mobile", "QA"]:
        ws.cell(r, 1, value=tr).border = THIN
        ws.cell(r, 2, value=f"=COUNTIF(T_MASTER[Track],A{r})").border = THIN
        ws.cell(r, 3, value=f"=COUNTIFS(T_MASTER[Track],A{r},T_MASTER[Overall Status],\"Done\")").border = THIN
        cell = ws.cell(r, 4, value=f"=IF(B{r}=0,\"\",C{r}/B{r})")
        cell.number_format = "0.0%"
        cell.border = THIN
        r += 1

    r += 1
    ws.cell(r, 1, value="Tip: For charts/graphs open S02_Sprint_Dashboard (pie + bar + stacked status). Filter S03 by Work Bifurcation to list tasks.")
    ws.cell(r, 1).fill = FILLS["warn"]

    # Add bar chart for % complete by bifurcation on main dashboard
    # Remove extra charts if too many — keep it to one new chart
    # Check existing charts count
    while len(ws._charts) > 2:
        ws._charts.pop()

    bar = BarChart()
    bar.type = "bar"
    bar.title = "% Complete by Work Bifurcation (Main Dashboard)"
    data = Reference(ws, min_col=9, min_row=header_r, max_row=last_lane)
    cats = Reference(ws, min_col=1, min_row=first_lane, max_row=last_lane)
    bar.add_data(data, titles_from_data=True)
    bar.set_categories(cats)
    bar.width = 16
    bar.height = 12
    ws.add_chart(bar, "K58")

    for col, w in enumerate([28, 10, 10, 12, 12, 10, 10, 8, 12], 1):
        ws.column_dimensions[get_column_letter(col)].width = max(
            ws.column_dimensions[get_column_letter(col)].width or 0, w
        )


def update_guides(wb):
    if "S00_Sprint_Cover" in wb.sheetnames:
        ws = wb["S00_Sprint_Cover"]
        ws["A24"] = (
            "TRACKING: Purple column Work Bifurcation = UI | Web Frontend | Web UI | Web API | API Mobile | "
            "Mobile UI | Mobile Frontend | Mobile UX | QA | Database | Security | Integration | … "
            "Open S02_Sprint_Dashboard for % + charts; 08_Dashboard for main product view."
        )
        ws["A24"].fill = FILLS["purple"]
        ws["A24"].font = FONT_H
    if "S00_How_To_Execute" in wb.sheetnames:
        ws = wb["S00_How_To_Execute"]
        ws["A16"] = (
            "Easy tracking: change Week Status → see % Complete on S02 (by Work Lane) and 08_Dashboard. "
            "Each lane (UI, Web API, Mobile UI, QA, …) has its own Done / In Progress / Not Started counts."
        )
        ws["A16"].fill = FILLS["warn"]


def main():
    if not TARGET.exists():
        raise SystemExit(f"Missing {TARGET}")
    backup = TARGET.with_name(
        TARGET.stem + f"_backup_before_dashboard_lanes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )
    shutil.copy2(TARGET, backup)
    print("Backup:", backup)

    print("Loading…")
    wb = load_workbook(TARGET)
    meta = load_module_meta(wb)
    print("Meta sub-tasks:", len(meta))

    print("Reclassifying Work Bifurcation…")
    counts = apply_bifurcation(wb, meta)
    print("Lane counts (S03):")
    for k, v in counts.items():
        if v:
            print(f"  {k}: {v}")
    print("Total classified:", sum(counts.values()))

    print("Rebuilding S02_Sprint_Dashboard…")
    rebuild_s02(wb)

    print("Enhancing 08_Dashboard…")
    enhance_main_dashboard(wb)

    update_guides(wb)

    wb.save(TARGET)
    print("Saved:", TARGET)
    print("Open S02_Sprint_Dashboard and 08_Dashboard — Calculate Now if needed.")


if __name__ == "__main__":
    main()
