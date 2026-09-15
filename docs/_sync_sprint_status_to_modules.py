#!/usr/bin/env python3
"""
Make S1_Week1…S5_Week5 the single place to edit Status / Assigned.

Then:
  Module sheets M00–M19  ← live formulas from the week sheet row
  01_MASTER / 08_Dashboard ← already read modules → update automatically
  S03_ALL_1000_Sprint_Tasks ← also live from week sheets

Also merges existing progress both ways once (module Done → sprint if sprint
still Not Started; sprint Done kept) so already-marked week-sheet work appears
on modules/Dashboard.
"""

from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path("/Users/OctazenWork/NIGA_Homepathy/UI/NIGAHomeopathy_UI")
TARGET = ROOT / "NIGA_PENDING_IMPLEMENTATION_TASK_TRACKER (1).xlsx"

GOLD = PatternFill("solid", fgColor="F9E79F")
SYNC = PatternFill("solid", fgColor="D6EAF8")  # light blue = live from sprint
WARN = PatternFill("solid", fgColor="FDEBD0")
FONT_N = Font(name="Calibri", size=10, color="1C2833")
FONT_B = Font(name="Calibri", bold=True, size=11, color="1B3A4B")
WRAP = Alignment(wrap_text=True, vertical="top")
THIN = Border(
    left=Side(style="thin", color="D0D5DD"),
    right=Side(style="thin", color="D0D5DD"),
    top=Side(style="thin", color="D0D5DD"),
    bottom=Side(style="thin", color="D0D5DD"),
)

WEEK_SHEETS = ["S1_Week1", "S2_Week2", "S3_Week3", "S4_Week4", "S5_Week5"]

# Module sheet columns (header row 2, data from row 3) — M02 style
MOD = {
    "sub_id": 11,  # K
    "lead": 20,  # T
    "fe_status": 22,  # V
    "fe_asg": 23,  # W
    "be_status": 25,  # Y
    "be_asg": 26,  # Z
    "db_status": 28,  # AB
    "db_asg": 29,  # AC
    "api_status": 31,  # AE
    "api_asg": 32,  # AF
    "mob_status": 34,  # AH
    "mob_asg": 35,  # AI
    "int_status": 37,  # AK
    "int_asg": 38,  # AL
}

# Sprint week sheet columns (header row 3, data from row 4)
SPR = {
    "sub_id": 13,  # M
    "lead": 21,  # U
    "fe_status": 23,  # W
    "fe_asg": 24,  # X
    "be_status": 26,  # Z
    "be_asg": 27,  # AA
    "db_status": 29,  # AC
    "db_asg": 30,  # AD
    "api_status": 32,  # AF
    "api_asg": 33,  # AG
    "mob_status": 35,  # AI
    "mob_asg": 36,  # AJ
    "int_status": 38,  # AL
    "int_asg": 39,  # AM
}

SYNC_FIELDS = [
    "lead",
    "fe_status",
    "fe_asg",
    "be_status",
    "be_asg",
    "db_status",
    "db_asg",
    "api_status",
    "api_asg",
    "mob_status",
    "mob_asg",
    "int_status",
    "int_asg",
]

STATUS_FIELDS = [
    "fe_status",
    "be_status",
    "db_status",
    "api_status",
    "mob_status",
    "int_status",
]

PROGRESS = {"Done", "In Progress", "Blocked", "Deferred"}


def is_formula(val) -> bool:
    if val is None:
        return False
    if isinstance(val, str) and val.startswith("="):
        return True
    # ArrayFormula etc.
    text = getattr(val, "text", None)
    return bool(text and str(text).startswith("="))


def cell_str(val) -> str:
    if val is None:
        return ""
    if is_formula(val):
        return ""
    return str(val).strip()


def status_rank(val: str) -> int:
    order = {
        "Done": 5,
        "Blocked": 4,
        "In Progress": 3,
        "Deferred": 2,
        "Not Started": 1,
        "N/A": 0,
        "": -1,
    }
    return order.get(val, 0)


def prefer_status(sprint_v: str, module_v: str) -> str:
    """Keep richer progress: sprint wins if progressed; else take module progress."""
    s, m = sprint_v or "", module_v or ""
    if status_rank(s) >= status_rank(m) and s:
        return s
    if m:
        return m
    return s or m or "Not Started"


def prefer_assigned(sprint_v: str, module_v: str) -> str:
    s, m = sprint_v or "", module_v or ""
    if s and s.lower() not in ("unassigned", ""):
        return s
    if m and m.lower() not in ("unassigned", ""):
        return m
    return s or m or "Unassigned"


def build_sprint_index(wb):
    """sub_id -> {sheet, row, values...}"""
    idx = {}
    for sn in WEEK_SHEETS:
        ws = wb[sn]
        for r in range(4, ws.max_row + 1):
            sid = cell_str(ws.cell(r, SPR["sub_id"]).value)
            if not sid:
                continue
            vals = {f: cell_str(ws.cell(r, SPR[f]).value) for f in SYNC_FIELDS}
            idx[sid] = {"sheet": sn, "row": r, "vals": vals}
    return idx


def build_module_index(wb):
    """sub_id -> {sheet, row, values...}"""
    idx = {}
    for sn in wb.sheetnames:
        if not (sn.startswith("M") and len(sn) > 1 and sn[1].isdigit()):
            continue
        ws = wb[sn]
        for r in range(3, ws.max_row + 1):
            sid = cell_str(ws.cell(r, MOD["sub_id"]).value)
            if not sid:
                continue
            vals = {}
            for f in SYNC_FIELDS:
                vals[f] = cell_str(ws.cell(r, MOD[f]).value)
            idx[sid] = {"sheet": sn, "row": r, "vals": vals}
    return idx


def merge_progress_into_sprints(wb, sprint_idx, module_idx):
    """Write merged status/assigned VALUES onto week sheets (source of truth)."""
    updated = 0
    for sid, sinfo in sprint_idx.items():
        minfo = module_idx.get(sid)
        if not minfo:
            continue
        ws = wb[sinfo["sheet"]]
        r = sinfo["row"]
        changed = False
        for f in SYNC_FIELDS:
            sv = sinfo["vals"].get(f, "")
            mv = minfo["vals"].get(f, "")
            if f in STATUS_FIELDS:
                nv = prefer_status(sv, mv)
            else:
                nv = prefer_assigned(sv, mv)
            if nv != sv:
                ws.cell(r, SPR[f]).value = nv
                sinfo["vals"][f] = nv
                changed = True
        if changed:
            updated += 1
    return updated


def wire_modules_to_sprints(wb, sprint_idx):
    """Replace module Status/Assigned cells with formulas pointing at week sheets."""
    linked = 0
    missing = 0
    for sn in wb.sheetnames:
        if not (sn.startswith("M") and len(sn) > 1 and sn[1].isdigit()):
            continue
        ws = wb[sn]
        # Banner
        old = ws["A1"].value or ""
        note = (
            "⚡ STATUS SYNC: Assigned To + Frontend/Backend/Database/API/Mobile/Integration "
            "Status & Assigned are LIVE from S1_Week1…S5_Week5 (light blue cells). "
            "Edit yellow dropdowns on the Sprint week sheet only — modules + Dashboard update automatically."
        )
        if "STATUS SYNC" not in str(old):
            ws["A1"].value = str(old)[:180] + "  |  " + note
        ws["A1"].alignment = WRAP

        for r in range(3, ws.max_row + 1):
            sid = cell_str(ws.cell(r, MOD["sub_id"]).value)
            if not sid:
                continue
            sinfo = sprint_idx.get(sid)
            if not sinfo:
                missing += 1
                continue
            src = sinfo["sheet"]
            sr = sinfo["row"]
            for f in SYNC_FIELDS:
                mcol = MOD[f]
                scol = SPR[f]
                letter = get_column_letter(scol)
                # Absolute sheet ref
                formula = f"='{src}'!{letter}{sr}"
                cell = ws.cell(r, mcol)
                cell.value = formula
                cell.fill = SYNC
                cell.font = FONT_N
                cell.alignment = WRAP
                cell.border = THIN
            linked += 1
        # Remove status/assigned data validations on module sheets (formulas)
        # Keep validations only if they don't break — Excel allows DV on formula cells but editing overwrites.
        # Clear DVs that target assigned/status columns to reduce confusion.
        try:
            keep = []
            for dv in ws.data_validations.dataValidation:
                sq = str(dv.sqref)
                # Drop validations that cover T,V,W,Y,Z,... status/assigned ranges roughly
                # Safer: remove all DVs on module sheet for assigned/status — user edits sprint
                # Keep if only unrelated — simplest remove all module DVs for assigned columns
                keep.append(dv)  # leave; formulas still display
            # actually leave validations — OK
        except Exception:
            pass
    return linked, missing


def wire_s03_to_weeks(wb, sprint_idx):
    """S03_ALL status columns live from week sheets too."""
    if "S03_ALL_1000_Sprint_Tasks" not in wb.sheetnames:
        return 0
    ws = wb["S03_ALL_1000_Sprint_Tasks"]
    # headers row 3 — same SPR columns as week sheets
    n = 0
    for r in range(4, ws.max_row + 1):
        sid = cell_str(ws.cell(r, SPR["sub_id"]).value)
        if not sid:
            continue
        sinfo = sprint_idx.get(sid)
        if not sinfo:
            continue
        src, sr = sinfo["sheet"], sinfo["row"]
        for f in SYNC_FIELDS:
            letter = get_column_letter(SPR[f])
            cell = ws.cell(r, SPR[f])
            cell.value = f"='{src}'!{letter}{sr}"
            cell.fill = SYNC
            cell.font = FONT_N
        n += 1
    # banner
    ws["A2"].value = (
        "⚡ LIVE from S1_Week1…S5_Week5 — do not edit Status/Assigned here. "
        "Edit yellow cells on the Week sheet. This view + Module sheets + Dashboard follow automatically."
    )
    ws["A2"].fill = WARN
    return n


def update_sprint_banners(wb):
    for sn in WEEK_SHEETS:
        ws = wb[sn]
        ws["A2"].value = (
            f"⚡ EDIT STATUS HERE ({sn}). Yellow dropdowns = source of truth. "
            "Changes auto-sync to Module sheets (M00–M19), S03_ALL, 01_MASTER and 08_Dashboard. "
            "Do not edit Status on module sheets (those cells are light-blue live links)."
        )
        ws["A2"].fill = WARN
        ws["A2"].font = FONT_B
        ws["A2"].alignment = WRAP


def update_cover_and_howto(wb):
    if "S00_Sprint_Cover" in wb.sheetnames:
        ws = wb["S00_Sprint_Cover"]
        ws["A22"] = (
            "STATUS SYNC RULE: Change Frontend/Backend/Database/API/Mobile/Integration Status "
            "and Assigned ONLY on S1_Week1…S5_Week5 (yellow). Module sheets show light-blue live links. "
            "08_Dashboard counts update because 01_MASTER reads the module sheets."
        )
        ws["A22"].fill = WARN
        ws["A22"].font = FONT_B
    if "S00_How_To_Execute" in wb.sheetnames:
        ws = wb["S00_How_To_Execute"]
        ws["A14"] = (
            "STATUS: Edit yellow Status/Assigned on your Week sheet only → Module sheet + Dashboard update live. "
            "Already-marked Done on week sheets is merged and reflected on modules."
        )
        ws["A14"].fill = WARN
    if "00_Cover" in wb.sheetnames:
        ws = wb["00_Cover"]
        ws["A34"] = (
            "Sprint status sync ON: edit S1_Week1…S5_Week5 yellow Status → M00–M19 + 08_Dashboard update automatically."
        )
        ws["A34"].fill = WARN
        ws["A34"].font = FONT_B

    # Update 08_Dashboard hint
    if "08_Dashboard" in wb.sheetnames:
        ws = wb["08_Dashboard"]
        ws["A1"] = (
            "LIVE DASHBOARD — counts read T_MASTER → module sheets → which now LIVE-LINK Status from "
            "S1_Week1…S5_Week5. Change a yellow Status on a Week sheet and these numbers change (Excel may need Calculate)."
        )


def update_apps_script_note(wb):
    """Remind Google Sheets users: module status is formula-driven; Assigned DV stays on week sheets."""
    if "00_Sheets_Dropdown" not in wb.sheetnames:
        return
    ws = wb["00_Sheets_Dropdown"]
    ws["A13"] = (
        "Status sync: Module Status/Assigned cells are formulas from S1–S5. "
        "Run Assigned dropdown setup on Week sheets (S1_Week1…). Do not overwrite module light-blue formula cells."
    )


def refresh_sprint_index_after_merge(wb):
    return build_sprint_index(wb)


def verify(wb, sprint_idx):
    # Spot-check: pick a Done mobile from sprint and ensure module has formula
    samples = []
    for sid, info in sprint_idx.items():
        if info["vals"].get("mob_status") == "Done" or info["vals"].get("fe_status") == "Done":
            samples.append(sid)
            if len(samples) >= 5:
                break
    ok = 0
    for sid in samples:
        info = sprint_idx[sid]
        # find module
        for sn in wb.sheetnames:
            if not (sn.startswith("M") and sn[1].isdigit()):
                continue
            ws = wb[sn]
            for r in range(3, ws.max_row + 1):
                if cell_str(ws.cell(r, MOD["sub_id"]).value) == sid:
                    v = ws.cell(r, MOD["fe_status"]).value
                    if isinstance(v, str) and v.startswith("=") and info["sheet"] in v:
                        ok += 1
                    print("VERIFY", sid, "module", sn, "r", r, "FE formula", v)
                    break
    return ok, samples


def main():
    if not TARGET.exists():
        raise SystemExit(f"Missing {TARGET}")

    backup = TARGET.with_name(
        TARGET.stem + f"_backup_before_status_sync_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )
    shutil.copy2(TARGET, backup)
    print("Backup:", backup)

    print("Loading…")
    wb = load_workbook(TARGET)

    sprint_idx = build_sprint_index(wb)
    module_idx = build_module_index(wb)
    print(f"Sprint sub-tasks indexed: {len(sprint_idx)}")
    print(f"Module sub-tasks indexed: {len(module_idx)}")

    # Any sprint id missing from modules?
    only_sprint = set(sprint_idx) - set(module_idx)
    only_module = set(module_idx) - set(sprint_idx)
    print(f"Only on sprint: {len(only_sprint)} | Only on module: {len(only_module)}")

    print("Merging existing progress into week sheets…")
    merged = merge_progress_into_sprints(wb, sprint_idx, module_idx)
    print(f"Week rows updated from module progress: {merged}")

    # rebuild index after merge
    sprint_idx = refresh_sprint_index_after_merge(wb)

    print("Wiring module sheets → week sheet formulas…")
    linked, missing = wire_modules_to_sprints(wb, sprint_idx)
    print(f"Module rows linked: {linked} | missing sprint map: {missing}")

    print("Wiring S03_ALL → week sheets…")
    n03 = wire_s03_to_weeks(wb, sprint_idx)
    print(f"S03 rows linked: {n03}")

    update_sprint_banners(wb)
    update_cover_and_howto(wb)
    update_apps_script_note(wb)

    ok, samples = verify(wb, sprint_idx)
    print(f"Verify OK formulas: {ok}/{len(samples)}")

    # Count Done on sprints after merge
    done_fe = sum(1 for i in sprint_idx.values() if i["vals"].get("fe_status") == "Done")
    done_mob = sum(1 for i in sprint_idx.values() if i["vals"].get("mob_status") == "Done")
    print(f"Sprint Frontend Status=Done: {done_fe} | Mobile Status=Done: {done_mob}")

    wb.save(TARGET)
    print("Saved:", TARGET)
    print(
        "\nDONE. Edit yellow Status on S1_Week1…S5_Week5 only. "
        "Module light-blue cells + Dashboard follow. "
        "In Excel: Formulas → Calculate Now if Dashboard looks stale."
    )


if __name__ == "__main__":
    main()
