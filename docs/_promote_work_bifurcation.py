#!/usr/bin/env python3
"""
Make Work Bifurcation the PRIMARY tracking label on every task row:

  UI | Web Frontend | Web UI | Web API | API Mobile | Mobile UI | Mobile Frontend |
  QA | Database | Security | Integration | Web Other | Other

- Fix S1 Track/Phase header misalignment
- Put Work Bifurcation in the early visible Track column (H) on sprint sheets
- Keep classic Web/UI/Mobile/QA as "Track Classic"
- Sync same bifurcation on modules + S03 + MASTER
- Add 09_By_Work_Bifurcation filter sheet for easy tracking
- Do not skip any of the 1000 tasks
"""

from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

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
PURPLE = PatternFill("solid", fgColor="E8DAEF")
HEADER_P = PatternFill("solid", fgColor="6C3483")
GOLD = PatternFill("solid", fgColor="F9E79F")
WARN = PatternFill("solid", fgColor="FDEBD0")
HEADER = PatternFill("solid", fgColor="1B3A4B")
FONT_W = Font(name="Calibri", bold=True, color="FFFFFF", size=11)
FONT_H = Font(name="Calibri", bold=True, color="1B3A4B", size=12)
FONT_N = Font(name="Calibri", size=10, color="1C2833")

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
    t = (track or "").strip()
    ly = (layer or "").strip()
    ly_l = ly.lower()
    s = (sub or "").lower()
    surf = (surface or "").lower()

    if t == "QA" or ly == "QA" or s.startswith("qa:") or s.startswith("regression"):
        return "QA"

    if t == "UI":
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
        return "UI"

    if t == "Mobile" or "mobile" in ly_l:
        if ly == "Mobile UI" or ly_l == "mobile ui":
            return "Mobile UI"
        if ly == "Mobile UX" or ly_l == "mobile ux":
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
        return "Web Frontend"

    return "Other"


def load_meta(wb):
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
                "phase": ws.cell(r, 6).value,
                "phase_name": ws.cell(r, 7).value,
                "sheet": sn,
                "row": r,
            }
    return meta


def find_or_add_header(ws, header_row: int, title: str, fill=HEADER_P) -> int:
    headers = {str(c.value).strip(): c.column for c in ws[header_row] if c.value}
    if title in headers:
        return headers[title]
    last = 1
    for c in range(1, ws.max_column + 5):
        if ws.cell(header_row, c).value:
            last = c
    col = last + 1
    cell = ws.cell(header_row, col, value=title)
    cell.fill = fill
    cell.font = FONT_W
    cell.alignment = CENTER
    cell.border = THIN
    ws.column_dimensions[get_column_letter(col)].width = 18
    return col


def fix_and_promote_sprint_sheets(wb, meta):
    """
    Sprint layout target (like S03):
      H = Work Bifurcation (PRIMARY — fine lanes)
      I = Phase
      J = Phase Name
      … later: Track Classic, Work Bifurcation (dup ok at end)
    """
    sheets = WEEK_SHEETS + (["S03_ALL_1000_Sprint_Tasks"] if "S03_ALL_1000_Sprint_Tasks" in wb.sheetnames else [])
    counts = {k: 0 for k in LANES}
    for sn in sheets:
        ws = wb[sn]
        hr = 3
        # Normalize headers for H/I
        ws.cell(hr, 8).value = "Work Bifurcation"
        ws.cell(hr, 8).fill = HEADER_P
        ws.cell(hr, 8).font = FONT_W
        ws.cell(hr, 8).alignment = CENTER
        ws.cell(hr, 8).border = THIN

        # If I was wrongly labeled Track, set Phase
        i_header = str(ws.cell(hr, 9).value or "")
        if i_header in ("Track", "None", "") or "Track" in i_header:
            # S1 had Track on I with Phase values — fix to Phase
            pass
        ws.cell(hr, 9).value = "Phase"
        ws.cell(hr, 9).fill = HEADER
        ws.cell(hr, 9).font = FONT_W
        ws.cell(hr, 9).border = THIN

        if not ws.cell(hr, 10).value:
            ws.cell(hr, 10).value = "Phase Name"
            ws.cell(hr, 10).fill = HEADER
            ws.cell(hr, 10).font = FONT_W

        classic_col = find_or_add_header(ws, hr, "Track Classic (Web/UI/Mobile/QA)", fill=HEADER)
        bif_end = find_or_add_header(ws, hr, "Work Bifurcation", fill=HEADER_P)  # may already be AT

        # Sub Task ID col
        headers = {str(c.value).strip(): c.column for c in ws[hr] if c.value}
        sid_col = headers.get("Sub Task ID", 13)

        for r in range(hr + 1, ws.max_row + 1):
            sid = ws.cell(r, sid_col).value
            if not sid:
                continue
            sid = str(sid).strip()
            m = meta.get(sid)
            if not m:
                continue
            lane = classify(m["track"], m["layer"], m["sub"], m["surface"])
            classic = m["track"] if m["track"] in ("Web", "UI", "Mobile", "QA") else m["track"]

            # PRIMARY visible column H
            cell = ws.cell(r, 8, value=lane)
            cell.fill = PURPLE
            cell.font = FONT_N
            cell.alignment = CENTER
            cell.border = THIN

            # Phase restore from module when week sheet had garbage in I
            # Keep existing phase if looks like a phase code; else from module
            cur_phase = ws.cell(r, 9).value
            if cur_phase in (None, "", "Web", "UI", "Mobile", "QA") or str(cur_phase) in ("0",):
                # On S1, H had Web and I had PRE — after we overwrite H with lane,
                # set Phase from module (col Phase on module is index 6 = Phase number/code)
                ws.cell(r, 9).value = m.get("phase")
            # If I currently holds PRE-like and H held Web — for rows where I is PRE/0/2 etc., keep I as phase
            # Already OK for S2/S03. For S1 row4 I=PRE which IS phase — keep it.
            if str(ws.cell(r, 9).value) in ("Web", "UI", "Mobile", "QA"):
                ws.cell(r, 9).value = m.get("phase")

            # Classic track
            ccell = ws.cell(r, classic_col, value=classic or "")
            ccell.font = FONT_N
            ccell.border = THIN
            ccell.alignment = CENTER

            # End bif column same value
            bcell = ws.cell(r, bif_end, value=lane)
            bcell.fill = PURPLE
            bcell.font = FONT_N
            bcell.border = THIN
            bcell.alignment = CENTER

            if sn == "S03_ALL_1000_Sprint_Tasks":
                counts[lane] = counts.get(lane, 0) + 1

        # Banner
        ws["A2"].value = (
            f"⚡ PRIMARY TRACKING COLUMN H = Work Bifurcation "
            f"(UI / Web Frontend / Web UI / Web API / API Mobile / Mobile UI / Mobile Frontend / QA / …). "
            f"NOT Web/UI/Mobile/QA. Edit yellow Status here → dashboards update. "
            f"Filter column H for easy tracking."
        )
        ws["A2"].fill = WARN
        ws["A2"].alignment = WRAP
        ws.column_dimensions["H"].width = 18

    return counts


def update_modules(wb, meta):
    for sn in wb.sheetnames:
        if not (sn.startswith("M") and sn[1].isdigit()):
            continue
        ws = wb[sn]
        bif_col = find_or_add_header(ws, 2, "Work Bifurcation", fill=HEADER_P)
        # Also add Track Classic label clarity on Track header
        if ws.cell(2, 5).value == "Track":
            ws.cell(2, 5).value = "Track Classic (Web/UI/Mobile/QA)"
            ws.cell(2, 5).fill = HEADER
            ws.cell(2, 5).font = FONT_W

        for r in range(3, ws.max_row + 1):
            sid = ws.cell(r, 11).value
            if not sid:
                continue
            m = meta.get(str(sid).strip())
            if not m:
                continue
            lane = classify(m["track"], m["layer"], m["sub"], m["surface"])
            cell = ws.cell(r, bif_col, value=lane)
            cell.fill = PURPLE
            cell.font = FONT_N
            cell.alignment = CENTER
            cell.border = THIN

        old = str(ws["A1"].value or "")
        note = (
            " | PRIMARY filter: purple Work Bifurcation = UI / Web Frontend / Web UI / Web API / "
            "API Mobile / Mobile UI / Mobile Frontend / QA (not only Web/UI/Mobile/QA)."
        )
        if "Work Bifurcation" not in old:
            ws["A1"].value = old[:200] + note
        ws["A1"].alignment = WRAP


def update_master(wb, meta):
    """Add Work Bifurcation column to 01_MASTER live from module sheets."""
    if "01_MASTER" not in wb.sheetnames:
        return
    ws = wb["01_MASTER"]
    # header row 2
    bif_col = None
    for c in range(1, ws.max_column + 3):
        if ws.cell(2, c).value and "Work Bifurcation" in str(ws.cell(2, c).value):
            bif_col = c
            break
    if bif_col is None:
        # after Track (5) insert visually — append at end to not break table refs badly
        bif_col = find_or_add_header(ws, 2, "Work Bifurcation", fill=HEADER_P)

    # Rename Track header for clarity
    if ws.cell(2, 5).value and str(ws.cell(2, 5).value).strip() == "Track":
        ws.cell(2, 5).value = "Track Classic (Web/UI/Mobile/QA)"

    # Write formulas: VLOOKUP ModMap + INDEX/MATCH bif column on module
    # Module Work Bifurcation column number may vary — use MATCH on header row 2
    for r in range(3, ws.max_row + 1):
        sid = ws.cell(r, 11).value
        if not sid:
            continue
        # Prefer direct value from meta for reliability (MASTER is mirror; values OK if modules are source)
        # But MASTER uses formulas for status — use formula for bif too for live updates when module bif changes
        formula = (
            f'=IFERROR(INDEX(INDIRECT("\'"&VLOOKUP($C{r},ModMap!$A$2:$B$21,2,FALSE)&"\'!A:ZZ"),'
            f'MATCH($K{r},INDIRECT("\'"&VLOOKUP($C{r},ModMap!$A$2:$B$21,2,FALSE)&"\'!$K:$K"),0),'
            f'MATCH("Work Bifurcation",INDIRECT("\'"&VLOOKUP($C{r},ModMap!$A$2:$B$21,2,FALSE)&"\'!$2:$2"),0)),"")'
        )
        # Simpler: write value from meta (module bif updated in same run); MASTER refresh on reopen if formula heavy
        m = meta.get(str(sid).strip())
        if m:
            lane = classify(m["track"], m["layer"], m["sub"], m["surface"])
            cell = ws.cell(r, bif_col, value=lane)
            cell.fill = PURPLE
            cell.alignment = CENTER
            cell.border = THIN

    # Extend table if exists
    if "T_MASTER" in ws.tables:
        tab = ws.tables["T_MASTER"]
        # expand ref to include new column
        from openpyxl.worksheet.table import Table
        ref = tab.ref  # e.g. A2:AP1002
        # parse and extend
        try:
            end = get_column_letter(bif_col)
            # keep start, change end col
            start_cell, end_cell = ref.split(":")
            end_row = end_cell[1:] if end_cell[1].isdigit() else "".join(ch for ch in end_cell if ch.isdigit())
            # safer parse
            import re
            m = re.match(r"([A-Z]+)(\d+):([A-Z]+)(\d+)", ref)
            if m:
                tab.ref = f"{m.group(1)}{m.group(2)}:{end}{m.group(4)}"
        except Exception as e:
            print("Table expand note:", e)

    ws["A1"].value = (
        "MASTER MIRROR — Work Bifurcation (purple) is the PRIMARY task type for tracking: "
        "UI / Web Frontend / Web UI / Web API / API Mobile / Mobile UI / Mobile Frontend / QA / … "
        "Track Classic remains Web/UI/Mobile/QA. Edit Status on Sprint week sheets or module light-blue links."
    )


def build_bifurcation_sheet(wb, meta):
    """Easy filter sheet: all 1000 rows with Work Bifurcation first."""
    name = "09_By_Work_Bifurcation"
    if name in wb.sheetnames:
        del wb[name]
    # place after 08_Dashboard
    idx = wb.sheetnames.index("08_Dashboard") + 1 if "08_Dashboard" in wb.sheetnames else 10
    ws = wb.create_sheet(name, idx)

    ws["A1"] = (
        "ALL 1000 TASKS by Work Bifurcation — filter column A "
        "(UI / Web Frontend / Web UI / Web API / API Mobile / Mobile UI / Mobile Frontend / QA / …). "
        "This is the easy tracking view. Status is live from module sheets (same as MASTER)."
    )
    ws["A1"].fill = WARN
    ws["A1"].alignment = WRAP
    ws.merge_cells("A1:L1")
    ws.row_dimensions[1].height = 40

    headers = [
        "Work Bifurcation",
        "Track Classic",
        "Dev Module Code",
        "Dev Module",
        "Main Task ID",
        "Main Task",
        "Sub Task ID",
        "Sub Task",
        "Overall Status",
        "Sprint Week",
        "Module Sheet",
        "Open hint",
    ]
    for c, h in enumerate(headers, 1):
        cell = ws.cell(2, c, value=h)
        cell.fill = HEADER_P
        cell.font = FONT_W
        cell.border = THIN
        cell.alignment = CENTER

    # Sprint map from S03
    sprint_of = {}
    if "S03_ALL_1000_Sprint_Tasks" in wb.sheetnames:
        s03 = wb["S03_ALL_1000_Sprint_Tasks"]
        for r in range(4, s03.max_row + 1):
            sid = s03.cell(r, 13).value
            if sid:
                sprint_of[str(sid).strip()] = str(s03.cell(r, 1).value or "")

    # Sort by lane order then module
    lane_order = {k: i for i, k in enumerate(LANES)}
    rows = []
    for sid, m in meta.items():
        lane = classify(m["track"], m["layer"], m["sub"], m["surface"])
        rows.append((lane_order.get(lane, 99), m["sheet"], sid, m, lane))
    rows.sort()

    for i, (_, sheet, sid, m, lane) in enumerate(rows):
        r = 3 + i
        vals = []
        # Need module code from sheet name
        mod_code = sheet.split("_")[0]
        ws.cell(r, 1, value=lane).fill = PURPLE
        ws.cell(r, 1).border = THIN
        ws.cell(r, 2, value=m["track"]).border = THIN
        ws.cell(r, 3, value=mod_code).border = THIN
        # Dev module name from module sheet row
        mod_ws = wb[sheet]
        mr = m["row"]
        ws.cell(r, 4, value=mod_ws.cell(mr, 4).value).border = THIN
        ws.cell(r, 5, value=mod_ws.cell(mr, 9).value).border = THIN
        ws.cell(r, 6, value=mod_ws.cell(mr, 10).value).border = THIN
        ws.cell(r, 7, value=sid).border = THIN
        ws.cell(r, 8, value=mod_ws.cell(mr, 12).value).border = THIN
        # Overall Status on module sheets = column AN (40)
        ws.cell(
            r,
            9,
            value=f"=IFERROR(INDEX('{sheet}'!AN:AN,MATCH(G{r},'{sheet}'!$K:$K,0)),\"\")",
        ).border = THIN
        ws.cell(r, 10, value=sprint_of.get(sid, "")).border = THIN
        ws.cell(r, 11, value=sheet).border = THIN
        ws.cell(r, 12, value="Edit Status on Sprint week sheet").border = THIN

    last = 2 + len(rows)
    ws.freeze_panes = "A3"
    ws.auto_filter.ref = f"A2:L{last}"
    widths = [18, 14, 10, 22, 12, 36, 12, 40, 14, 10, 22, 28]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w

    # Summary counts at far right
    ws["N2"] = "Lane"
    ws["O2"] = "Count"
    ws["N2"].fill = HEADER_P
    ws["O2"].fill = HEADER_P
    ws["N2"].font = FONT_W
    ws["O2"].font = FONT_W
    for i, lane in enumerate(LANES):
        ws.cell(3 + i, 14, value=lane).fill = PURPLE
        ws.cell(3 + i, 15, value=f'=COUNTIF($A$3:$A${last},N{3+i})')
        ws.cell(3 + i, 14).border = THIN
        ws.cell(3 + i, 15).border = THIN

    return len(rows)


def update_dashboards_notes(wb):
    if "S02_Sprint_Dashboard" in wb.sheetnames:
        ws = wb["S02_Sprint_Dashboard"]
        ws["A2"] = (
            "PRIMARY task type = Work Bifurcation column H on week sheets / S03 "
            "(UI, Web Frontend, Web UI, Web API, API Mobile, Mobile UI, Mobile Frontend, QA, …) — "
            "NOT only Web/UI/Mobile/QA. Filter 09_By_Work_Bifurcation for the full list. "
            "Edit yellow Status on S1–S5 → % below update."
        )
        ws["A2"].fill = WARN
    if "08_Dashboard" in wb.sheetnames:
        ws = wb["08_Dashboard"]
        ws["A1"] = (
            "LIVE MAIN DASHBOARD — PRIMARY split = Work Bifurcation "
            "(UI / Web Frontend / Web UI / Web API / API Mobile / Mobile UI / Mobile Frontend / QA). "
            "See section WORK BIFURCATION + sheet 09_By_Work_Bifurcation. "
            "Track Classic (Web/UI/Mobile/QA) is secondary only."
        )
    if "S00_Sprint_Cover" in wb.sheetnames:
        ws = wb["S00_Sprint_Cover"]
        ws["A25"] = (
            "TASK TYPE FOR TRACKING = Work Bifurcation (column H on S1–S5): "
            "UI, Web Frontend, Web UI, Web API, API Mobile, Mobile UI, Mobile Frontend, QA, Database, Security, Integration, Other. "
            "Do not track only by Web/UI/Mobile/QA."
        )
        ws["A25"].fill = PURPLE
        ws["A25"].font = FONT_H


def main():
    if not TARGET.exists():
        raise SystemExit(f"Missing {TARGET}")
    backup = TARGET.with_name(
        TARGET.stem + f"_backup_before_bifurcation_promote_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )
    shutil.copy2(TARGET, backup)
    print("Backup:", backup)

    wb = load_workbook(TARGET)
    meta = load_meta(wb)
    print("Tasks:", len(meta))
    assert len(meta) == 1000

    print("Promoting Work Bifurcation on sprint sheets…")
    counts = fix_and_promote_sprint_sheets(wb, meta)
    print("S03 lane counts:")
    for k, v in counts.items():
        if v:
            print(f"  {k}: {v}")
    print("Total", sum(counts.values()))

    print("Updating modules…")
    update_modules(wb, meta)

    print("Updating MASTER…")
    update_master(wb, meta)

    print("Building 09_By_Work_Bifurcation…")
    n = build_bifurcation_sheet(wb, meta)
    print("Rows on bif sheet:", n)

    update_dashboards_notes(wb)

    # Fix S02/S03 COUNTIF to use column H for bifurcation if dashboards still point at AT
    # Update S02 formulas that reference AT to also work — H and AT both have bif now.
    # Prefer H as primary in S02 if we rebuild key COUNTIF ranges — quick replace AT -> H for bif counts
    for sn in ("S02_Sprint_Dashboard", "08_Dashboard"):
        if sn not in wb.sheetnames:
            continue
        ws = wb[sn]
        for row in ws.iter_rows():
            for cell in row:
                if isinstance(cell.value, str) and "S03_ALL_1000_Sprint_Tasks'!$AT$" in cell.value:
                    cell.value = cell.value.replace(
                        "S03_ALL_1000_Sprint_Tasks'!$AT$",
                        "S03_ALL_1000_Sprint_Tasks'!$H$",
                    )
                if isinstance(cell.value, str) and "S03_ALL_1000_Sprint_Tasks'!AT" in cell.value:
                    cell.value = cell.value.replace(
                        "S03_ALL_1000_Sprint_Tasks'!AT",
                        "S03_ALL_1000_Sprint_Tasks'!H",
                    )

    wb.save(TARGET)
    print("Saved", TARGET)


if __name__ == "__main__":
    main()
