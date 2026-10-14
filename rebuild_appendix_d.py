#!/usr/bin/env python3
"""Rebuild Appendix D of THESIS(1).docx in the HYDE Appendix D format.

Reference structure (HYDE "HYBRID DIFFERENTIAL EVOLUTION ... .docx", Appendix D):
  * "Appendix D" centered TNR 12 bold, then the section title centered
  * each section: ALL-CAPS bold+underline heading, intro sentence with bold
    UI names, then a BORDERLESS 5-column table holding the numbered items,
    then the figures
  * the 5 columns are 345/120/450/105/7620 dxa = exactly 6.00in, holding
    [pad " " | " " | "N." right-aligned | " " | item text justified]. Borders
    are nil, cell margins 0, vAlign top, fixed layout. HYDE's Table30 style is
    empty, so no tblStyle is written. The number column is 450 rather than the
    300 that the two pad columns originally gave up: at 300 dxa the leading pad
    space plus a two-digit "10." does not fit on one line and Word breaks it
    into "1" and "0.". Both pad columns are empty, so moving the boundary
    between them leaves the number's right edge and every other column exactly
    where they were.
  * figures are centered inline images, 6.00in wide, native aspect

Numbering restarts at 1 in every section, as in HYDE.

Usage:
    python3 rebuild_appendix_d.py [--doc DOCX] [--img-dir DIR]
"""
from __future__ import annotations

import argparse
import copy
import json
import re
import shutil
import sys
from pathlib import Path

import docx
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml
from docx.shared import Inches
from docx.table import Table
from docx.text.paragraph import Paragraph

FIGURE_WIDTH_IN = 6.0

# Which annotated figures belong to which appendix section, in order.
# Section order follows the thesis: 5 sections, 34 items.
SECTION_FIGURES = {
    "CONFIGURE A BENCHMARK RUN": [
        "run-sidebar", "run-instance", "run-engine", "run-parameters", "run-start",
    ],
    "MONITOR A RUNNING BENCHMARK": [
        "run-live-panels", "run-live-controls", "run-transport",
        "run-live-map", "run-live-signals", "run-complete",
    ],
    "STEP THROUGH A SINGLE TRIAL": [
        "sim-setup", "sim-pipeline", "sim-transport", "sim-code", "sim-log",
    ],
    "REVIEW COMPLETED RUNS": [
        "results-history", "results-detail-cards", "results-detail-charts",
    ],
    "EXPORT A RUN REPORT": [
        "results-export", "results-clear-history",
    ],
}

NIL_BORDERS = "".join(
    f'<w:{edge} w:color="000000" w:space="0" w:sz="0" w:val="nil"/>'
    for edge in ("top", "left", "bottom", "right")
)


def cell_xml(align: str, runs_xml: str = "") -> str:
    return (
        "<w:tc>"
        "<w:tcPr>"
        f"<w:tcBorders>{NIL_BORDERS}</w:tcBorders>"
        '<w:tcMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/>'
        '<w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tcMar>'
        '<w:vAlign w:val="top"/>'
        "</w:tcPr>"
        '<w:p><w:pPr><w:jc w:val="%s"/>'
        f'<w:rPr>{RUN_FONT}</w:rPr></w:pPr>'
        f'<w:r><w:rPr>{RUN_FONT}</w:rPr>'
        '<w:t xml:space="preserve"> </w:t></w:r>%s</w:p>'
        "</w:tc>"
    ) % (align, runs_xml)


def table_xml(items: list[tuple[str, str]]) -> str:
    """items is [(display_number, runs_xml)], numbered from 1 in this section."""
    rows = []
    for number, runs_xml in items:
        number_run = (
            f"<w:r><w:rPr>{RUN_FONT}</w:rPr>"
            f'<w:t xml:space="preserve">{number}.</w:t></w:r>'
        )
        cells = (
            cell_xml("both")
            + cell_xml("right")
            + cell_xml("right", number_run)
            + cell_xml("both")
            + cell_xml("both", runs_xml)
        )
        rows.append(
            "<w:tr>"
            '<w:trPr><w:cantSplit w:val="0"/><w:trHeight w:val="555" w:hRule="atLeast"/>'
            '<w:tblHeader w:val="0"/></w:trPr>'
            f"{cells}</w:tr>"
        )
    return (
        "<w:tbl %s>"
        "<w:tblPr>"
        '<w:tblW w:w="8640" w:type="dxa"/>'
        '<w:jc w:val="left"/>'
        f"<w:tblBorders>{NIL_BORDERS}"
        '<w:insideH w:color="000000" w:space="0" w:sz="0" w:val="nil"/>'
        '<w:insideV w:color="000000" w:space="0" w:sz="0" w:val="nil"/>'
        "</w:tblBorders>"
        '<w:tblLayout w:type="fixed"/>'
        '<w:tblLook w:val="0600"/>'
        "</w:tblPr>"
        '<w:tblGrid><w:gridCol w:w="345"/><w:gridCol w:w="120"/><w:gridCol w:w="450"/>'
        '<w:gridCol w:w="105"/><w:gridCol w:w="7620"/></w:tblGrid>'
        "%s</w:tbl>"
    ) % (nsdecls("w"), "".join(rows))


def is_heading(p: Paragraph) -> bool:
    if not p.text.strip():
        return False
    if not p.text.strip().isupper():
        return False
    runs = [r for r in p.runs if r.text.strip()]
    return bool(runs) and all(r.bold and r.underline for r in runs)


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    )


RUN_FONT = (
    '<w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" '
    'w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/>'
    '<w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl w:val="0"/>'
)


def item_runs_xml(p: Paragraph) -> str:
    """Item runs for a table cell: HYDE's cell font, with the bold UI names kept.

    The "N. " prefix is dropped, because the number now lives in its own cell.
    Runs are rebuilt rather than deep-copied: a copied w:r drags ~1.8 kB of
    redundant namespace declarations with it, which would bloat the document
    for no benefit.
    """
    runs = [r for r in p.runs if r.text]
    if not runs:
        raise SystemExit(f"empty item paragraph near {p.text[:60]!r}")
    m = re.match(r"^\s*\d+\.\s*", runs[0].text)
    if not m:
        raise SystemExit(f"item paragraph is not numbered: {p.text[:80]!r}")
    runs[0].text = runs[0].text[m.end():]

    out = []
    for r in runs:
        text = r.text
        if not text:
            continue
        rpr = ""
        if r.bold:
            rpr += "<w:b/>"
        if r.italic:
            rpr += "<w:i/>"
        out.append(
            f"<w:r><w:rPr>{RUN_FONT}{rpr}</w:rPr>"
            f'<w:t xml:space="preserve">{esc(text)}</w:t></w:r>'
        )
    if not out:
        raise SystemExit(f"item produced no runs: {p.text[:80]!r}")
    return "".join(out)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--doc", default="/home/joshua_bermas/Downloads/THESIS(1).docx")
    ap.add_argument("--img-dir", default="/home/joshua_bermas/projects/image")
    args = ap.parse_args()

    doc_path = Path(args.doc)
    img_dir = Path(args.img_dir)

    # Map slug -> annotated figure, keyed on the figNN prefix the annotator writes.
    figures: dict[str, Path] = {}
    for p in sorted(img_dir.glob("*-fig*-annotated.png")):
        m = re.match(r"^.*-fig(\d+)-(.+)-annotated\.png$", p.name)
        if m:
            figures[m.group(2)] = p
    if not figures:
        raise SystemExit(f"no annotated figures found in {img_dir}")
    missing = [
        (sec, slug)
        for sec, slugs in SECTION_FIGURES.items()
        for slug in slugs
        if slug not in figures
    ]
    if missing:
        raise SystemExit("missing figures: " + ", ".join(f"{s}/{g}" for s, g in missing))

    backup = doc_path.with_suffix(doc_path.suffix + ".appendixd.bak")
    shutil.copy2(doc_path, backup)
    print(f"backup -> {backup.name}")

    doc = docx.Document(str(doc_path))
    body = doc.element.body
    blocks = []
    for child in body.iterchildren():
        if child.tag == qn("w:p"):
            blocks.append(Paragraph(child, doc))
        elif child.tag == qn("w:tbl"):
            blocks.append(Table(child, doc))

    # Locate the appendix: "Appendix D" immediately followed by "SIMULATION".
    start = end = None
    for i, b in enumerate(blocks):
        if isinstance(b, Paragraph) and b.text.strip() == "Appendix D":
            nxt = blocks[i + 1] if i + 1 < len(blocks) else None
            if isinstance(nxt, Paragraph) and nxt.text.strip() == "SIMULATION":
                start = i
                break
    if start is None:
        raise SystemExit('could not find the "Appendix D" heading')
    for i in range(start, len(blocks)):
        if isinstance(blocks[i], Paragraph) and blocks[i].text.strip().startswith("CURRICULUM VITAE"):
            end = i
            break
    if end is None:
        raise SystemExit("could not find the end of Appendix D (CURRICULUM VITAE)")
    print(f"Appendix D spans blocks {start}..{end - 1}")

    # Parse the existing sections so the wording and bold UI names are reused.
    old = blocks[start:end]
    sections: list[dict] = []
    for b in old:
        if not isinstance(b, Paragraph):
            continue
        text = b.text.strip()
        if not text or text in ("Appendix D", "SIMULATION"):
            continue
        if is_heading(b):
            sections.append({"heading": text, "heading_el": copy.deepcopy(b._p), "intro": None, "items": []})
            continue
        if not sections:
            continue
        if re.match(r"^\s*\d+\.\s", text):
            sections[-1]["items"].append(b)
        elif sections[-1]["intro"] is None:
            sections[-1]["intro"] = copy.deepcopy(b._p)

    found = [s["heading"] for s in sections]
    if found != list(SECTION_FIGURES):
        raise SystemExit(f"section headings changed: {found}")

    # Build the replacement content at the end of the body, then splice it in.
    made: list = []

    def append_para(el) -> None:
        made.append(el)

    title = copy.deepcopy(blocks[start]._p)
    subtitle = copy.deepcopy(blocks[start + 1]._p)
    for t in subtitle.iter(qn("w:t")):
        if t.text and t.text.strip() == "SIMULATION":
            t.text = "SIMULATIONS"
    append_para(title)
    append_para(subtitle)
    blank = parse_xml(
        "<w:p %s><w:pPr><w:jc w:val='both'/></w:pPr></w:p>" % nsdecls("w")
    )
    append_para(blank)

    total_items = 0
    for si, sec in enumerate(sections):
        append_para(sec["heading_el"])
        append_para(sec["intro"])
        rows = [(str(i), item_runs_xml(p)) for i, p in enumerate(sec["items"], start=1)]
        total_items += len(rows)
        print(f"  {sec['heading']}: {len(rows)} items, "
              f"{len(SECTION_FIGURES[sec['heading']])} figures")
        append_para(parse_xml(table_xml(rows)))
        # Word needs a paragraph after a table; the spacer doubles as one.
        append_para(parse_xml(
            "<w:p %s><w:pPr><w:jc w:val='both'/></w:pPr></w:p>" % nsdecls("w")
        ))
        for slug in SECTION_FIGURES[sec["heading"]]:
            p = doc.add_paragraph()
            p.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = docx.shared.Pt(0)
            p.paragraph_format.space_after = docx.shared.Pt(6)
            p.add_run().add_picture(str(figures[slug]), width=Inches(FIGURE_WIDTH_IN))
            made.append(p._p)
        append_para(parse_xml(
            "<w:p %s><w:pPr><w:jc w:val='both'/></w:pPr></w:p>" % nsdecls("w")
        ))

    anchor = old[0]._p if isinstance(old[0], Paragraph) else old[0]._tbl
    for el in made:
        anchor.addprevious(el)
    for b in old:
        el = b._p if isinstance(b, Paragraph) else b._tbl
        el.getparent().remove(el)

    doc.save(str(doc_path))
    print(f"wrote {doc_path.name}: {total_items} items in {len(sections)} tables, "
          f"{sum(len(v) for v in SECTION_FIGURES.values())} figures")
    return 0


if __name__ == "__main__":
    sys.exit(main())