#!/usr/bin/env python3

import json
import re
import shutil
import subprocess
from collections import Counter, defaultdict
from html import escape
from pathlib import Path


DATA_PATH = Path("src/data/coreCourses.json")
OUTPUT_PATH = Path("CORE-ANALYSIS.md")
HTML_OUTPUT_PATH = Path("CORE-ANALYSIS.html")
CHART_DIR = Path("docs/core-charts")

COLORS = [
    "#82284A",
    "#C8A951",
    "#6e1f3e",
    "#9a7a2e",
]


def md_escape(value):
    return re.sub(r"\s+", " ", str(value or "")).strip().replace("|", "\\|")


def department(code):
    return code.split()[0]


def area_course_count(area):
    return sum(len(group["courses"]) for group in area["groups"])


def is_tiered(area):
    return any(re.search(r"Tier I|Tier II", group["label"], re.I) for group in area["groups"])


def department_counts(area):
    counts = defaultdict(Counter)
    totals = Counter()

    for group in area["groups"]:
        label = group["label"]
        for course in group["courses"]:
            dept = department(course["code"])
            counts[dept][label] += 1
            totals[dept] += 1

    departments = sorted(totals, key=lambda dept: (-totals[dept], dept))
    group_labels = [group["label"] for group in area["groups"]]
    return departments, group_labels, counts, totals


def slugify(value):
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def render_png(svg_path):
    png_path = svg_path.with_suffix(".png")

    renderers = [
        (["rsvg-convert", "--format", "png", "--output", str(png_path), str(svg_path)], "rsvg-convert"),
        (["magick", str(svg_path), str(png_path)], "ImageMagick"),
        (["sips", "--setProperty", "format", "png", str(svg_path), "--out", str(png_path)], "sips"),
    ]

    for command, label in renderers:
        if shutil.which(command[0]) is None:
            continue
        subprocess.run(command, check=True)
        return png_path, label

    raise RuntimeError(
        "Could not render PNG charts. Install librsvg (`rsvg-convert`), ImageMagick (`magick`), "
        "or use macOS `sips`."
    )


def write_svg(area):
    departments, group_labels, counts, totals = department_counts(area)

    chart_width = 920
    left = 92
    right = 32
    top = 78
    row_height = 28
    bar_height = 16
    bottom = 44
    plot_width = chart_width - left - right
    chart_height = top + (len(departments) * row_height) + bottom
    max_total = max(totals.values(), default=1)

    title = area["name"]
    subtitle = "Courses by department code"
    if len(group_labels) > 1:
        subtitle += " (stacked by catalog section)"

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{chart_width}" height="{chart_height}" viewBox="0 0 {chart_width} {chart_height}" role="img" aria-labelledby="title desc">',
        f"<title id=\"title\">{escape(title)} department histogram</title>",
        f"<desc id=\"desc\">{escape(subtitle)}</desc>",
        '<rect width="100%" height="100%" fill="#ffffff"/>',
        f'<text x="{left}" y="28" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#2c0c19">{escape(title)}</text>',
        f'<text x="{left}" y="50" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">{escape(subtitle)}</text>',
    ]

    legend_x = left
    legend_y = 66
    for index, label in enumerate(group_labels):
        color = COLORS[index % len(COLORS)]
        parts.append(f'<rect x="{legend_x}" y="{legend_y - 9}" width="10" height="10" rx="2" fill="{color}"/>')
        parts.append(f'<text x="{legend_x + 14}" y="{legend_y}" font-family="Arial, sans-serif" font-size="11" fill="#374151">{escape(label)}</text>')
        legend_x += 18 + (len(label) * 6)

    for i, dept in enumerate(departments):
        y = top + i * row_height
        parts.append(f'<text x="{left - 12}" y="{y + 13}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#374151">{escape(dept)}</text>')
        parts.append(f'<line x1="{left}" y1="{y + 8}" x2="{left + plot_width}" y2="{y + 8}" stroke="#f3f4f6" stroke-width="1"/>')

        x = left
        for group_index, label in enumerate(group_labels):
            value = counts[dept][label]
            if value == 0:
                continue
            width = max(2, (value / max_total) * plot_width)
            color = COLORS[group_index % len(COLORS)]
            parts.append(f'<rect x="{x}" y="{y}" width="{width:.2f}" height="{bar_height}" rx="3" fill="{color}"/>')
            if width > 18:
                parts.append(f'<text x="{x + width / 2:.2f}" y="{y + 12}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#ffffff">{value}</text>')
            x += width

        parts.append(f'<text x="{left + plot_width + 8}" y="{y + 13}" font-family="Arial, sans-serif" font-size="12" fill="#374151">{totals[dept]}</text>')

    parts.append(f'<text x="{left}" y="{chart_height - 14}" font-family="Arial, sans-serif" font-size="11" fill="#6b7280">Total courses: {area_course_count(area)}</text>')
    parts.append("</svg>")

    CHART_DIR.mkdir(parents=True, exist_ok=True)
    chart_path = CHART_DIR / f"{slugify(area['id'])}.svg"
    chart_path.write_text("\n".join(parts) + "\n")
    return chart_path


def write_department_table(lines, area):
    departments, group_labels, counts, totals = department_counts(area)

    lines.append("| Department | " + " | ".join(md_escape(label) for label in group_labels) + " | Total |")
    lines.append("| --- | " + " | ".join("---:" for _ in group_labels) + " | ---: |")
    for dept in departments:
        values = [str(counts[dept][label]) for label in group_labels]
        lines.append(f"| {dept} | " + " | ".join(values) + f" | {totals[dept]} |")
    lines.append("")


def write_course_table(lines, group):
    lines.append("| Code | Department | Title | Credits | Diversity |")
    lines.append("| --- | --- | --- | ---: | --- |")
    for course in group["courses"]:
        lines.append(
            f"| {md_escape(course['code'])} | {department(course['code'])} | "
            f"{md_escape(course['title'])} | {course['credits']} | "
            f"{'Yes' if course.get('diversity') else ''} |"
        )
    lines.append("")


def html_link(href, label):
    return f'<a href="{escape(href, quote=True)}">{escape(label)}</a>'


def html_department_table(area):
    departments, group_labels, counts, totals = department_counts(area)
    header_cells = "".join(f"<th>{escape(label)}</th>" for label in group_labels)
    rows = [
        f"<tr><th>Department</th>{header_cells}<th>Total</th></tr>"
    ]

    for dept in departments:
        value_cells = "".join(f"<td>{counts[dept][label]}</td>" for label in group_labels)
        rows.append(f"<tr><th>{escape(dept)}</th>{value_cells}<td>{totals[dept]}</td></tr>")

    return f"<table>{''.join(rows)}</table>"


def html_course_table(group):
    rows = [
        "<tr><th>Code</th><th>Department</th><th>Title</th><th>Credits</th><th>Diversity</th></tr>"
    ]

    for course in group["courses"]:
        rows.append(
            "<tr>"
            f"<td><code>{escape(course['code'])}</code></td>"
            f"<td>{escape(department(course['code']))}</td>"
            f"<td>{escape(course['title'])}</td>"
            f"<td>{course['credits']}</td>"
            f"<td>{'Yes' if course.get('diversity') else ''}</td>"
            "</tr>"
        )

    return f"<table>{''.join(rows)}</table>"


def write_html(data, chart_paths):
    summary_rows = []
    nav_items = []
    area_sections = []

    for area in data["areas"]:
        area_slug = slugify(area["id"])
        requirement_ids = ", ".join(f"<code>{escape(item)}</code>" for item in area["requirementIds"])
        structure = "Tiered" if is_tiered(area) else "Single-area"
        chart_path = chart_paths[area["id"]]["svg"]
        png_path = chart_paths[area["id"]]["png"]

        summary_rows.append(
            "<tr>"
            f"<th>{html_link('#' + area_slug, area['name'])}</th>"
            f"<td>{requirement_ids}</td>"
            f"<td>{structure}</td>"
            f"<td>{area['requiredCourses']}</td>"
            f"<td>{area['requiredCredits']}</td>"
            f"<td>{area_course_count(area)}</td>"
            "</tr>"
        )

        nav_items.append(f"<li>{html_link('#' + area_slug, area['name'])}</li>")

        group_sections = []
        for group in area["groups"]:
            group_sections.append(
                f"<h4>{escape(group['label'])}</h4>"
                f"{html_course_table(group)}"
            )

        area_sections.append(
            f'<section class="area" id="{area_slug}">'
            f"<h2>{escape(area['name'])}</h2>"
            f'<p class="source">Source: {html_link(area["sourceUrl"], area["sourceUrl"])}</p>'
            '<dl class="facts">'
            f"<div><dt>Requirement IDs</dt><dd>{requirement_ids}</dd></div>"
            f"<div><dt>Required courses</dt><dd>{area['requiredCourses']}</dd></div>"
            f"<div><dt>Required credits</dt><dd>{area['requiredCredits']}</dd></div>"
            f"<div><dt>Catalog courses captured</dt><dd>{area_course_count(area)}</dd></div>"
            "</dl>"
            f'<img class="chart" src="{escape(png_path.as_posix(), quote=True)}" alt="{escape(area["name"], quote=True)} department histogram">'
            f'<p class="chart-links">Chart files: {html_link(png_path.as_posix(), "PNG")} | {html_link(chart_path.as_posix(), "SVG")}</p>'
            "<h3>Department Counts</h3>"
            f"{html_department_table(area)}"
            f"{''.join(group_sections)}"
            "</section>"
        )

    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Loyola University Chicago Core Course Analysis</title>
  <style>
    :root {{
      color-scheme: light;
      --maroon: #82284a;
      --gold: #c8a951;
      --ink: #2c0c19;
      --muted: #5f6673;
      --line: #e5e7eb;
      --soft: #f8fafc;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: #fff;
      line-height: 1.5;
    }}
    header {{
      border-bottom: 1px solid var(--line);
      background: var(--soft);
    }}
    .wrap {{
      max-width: 1120px;
      margin: 0 auto;
      padding: 28px 20px;
    }}
    h1, h2, h3, h4 {{ line-height: 1.18; }}
    h1 {{ margin: 0 0 8px; font-size: clamp(2rem, 4vw, 3.25rem); }}
    h2 {{ margin: 0 0 12px; font-size: 1.65rem; }}
    h3 {{ margin: 28px 0 10px; font-size: 1.15rem; }}
    h4 {{ margin: 24px 0 10px; font-size: 1rem; }}
    p {{ margin: 0 0 14px; }}
    a {{ color: var(--maroon); }}
    code {{
      font-family: "SFMono-Regular", Consolas, monospace;
      font-size: 0.92em;
      background: #f3f4f6;
      padding: 0.1rem 0.28rem;
      border-radius: 4px;
    }}
    nav ul {{
      columns: 2;
      padding-left: 18px;
      margin: 8px 0 0;
    }}
    .summary, .notes, .area {{
      border-bottom: 1px solid var(--line);
    }}
    .lead, .source, .chart-links, .notes li {{
      color: var(--muted);
    }}
    .facts {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 10px;
      margin: 18px 0;
    }}
    .facts div {{
      border: 1px solid var(--line);
      border-left: 4px solid var(--gold);
      padding: 10px 12px;
      background: #fff;
    }}
    dt {{
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    dd {{ margin: 3px 0 0; font-weight: 700; }}
    .table-scroll {{
      overflow-x: auto;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 20px;
      font-size: 0.92rem;
    }}
    th, td {{
      border-bottom: 1px solid var(--line);
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }}
    th {{
      background: #f9fafb;
      font-weight: 700;
    }}
    td:nth-last-child(-n+3):not(:first-child) {{
      text-align: right;
    }}
    .chart {{
      display: block;
      width: 100%;
      max-width: 920px;
      height: auto;
      margin: 16px 0 8px;
      border: 1px solid var(--line);
    }}
    footer {{
      color: var(--muted);
      font-size: 0.88rem;
    }}
    @media (max-width: 720px) {{
      nav ul {{ columns: 1; }}
      table {{ min-width: 720px; }}
    }}
    @media print {{
      header, .summary, .notes, .area {{ break-inside: avoid; }}
      a {{ color: inherit; text-decoration: none; }}
    }}
  </style>
</head>
<body>
  <header>
    <div class="wrap">
      <h1>Loyola University Chicago Core Course Analysis</h1>
      <p class="lead">Catalog-derived University Core inventory for advising checklist planning.</p>
      <p class="source">Source: {html_link(data["sourceUrl"], data["sourceUrl"])}<br>Catalog: {escape(data["catalog"])}</p>
      <nav aria-label="Core areas">
        <h2>Core Areas</h2>
        <ul>{''.join(nav_items)}</ul>
      </nav>
    </div>
  </header>
  <main>
    <section class="summary">
      <div class="wrap">
        <h2>Summary</h2>
        <div class="table-scroll">
          <table>
            <tr><th>Core Area</th><th>Requirement IDs Used In App</th><th>Structure</th><th>Required Courses</th><th>Required Credits</th><th>Catalog Courses Captured</th></tr>
            {''.join(summary_rows)}
          </table>
        </div>
      </div>
    </section>
    <section class="notes">
      <div class="wrap">
        <h2>Notes For Advising Checklist Integration</h2>
        <ul>
          <li>Not all Core Areas are tiered. Artistic, Writing, Ethics, and Quantitative are single-area requirements.</li>
          <li>Historical, Literary, Philosophical, Scientific, Societal/Cultural, and Theological/Religious are tiered areas with Foundational/Tier I and Tier II course lists.</li>
          <li>Department-code histograms count catalog-listed courses by the prefix before the course number, such as <code>COMP</code>, <code>HIST</code>, or <code>THEO</code>.</li>
          <li>For tiered areas, histograms and department tables break counts out by catalog section.</li>
          <li>Blank course-level hours are treated as 3 credits by default; explicit catalog row values, such as UCWR 109 at 6 credits, are preserved.</li>
          <li>Courses marked with a diversity designation in the catalog are noted with Yes in the Diversity column.</li>
          <li>This inventory is a catalog-derived starting point. It should be confirmed with advising/admin stakeholders before driving official degree-audit behavior.</li>
        </ul>
      </div>
    </section>
    <div class="wrap">
      {''.join(area_sections)}
    </div>
  </main>
  <footer>
    <div class="wrap">
      Generated from {escape(DATA_PATH.as_posix())}. Regenerate with <code>python3 scripts/write-core-analysis.py</code>.
    </div>
  </footer>
</body>
</html>
"""
    HTML_OUTPUT_PATH.write_text(html)


def main():
    data = json.loads(DATA_PATH.read_text())
    lines = []
    chart_paths = {}

    lines.append("# Loyola University Chicago Core Course Analysis")
    lines.append("")
    lines.append(f"Source: {data['sourceUrl']}")
    lines.append(f"Catalog: {data['catalog']}")
    lines.append("")
    lines.append("This document summarizes the University Core course inventory currently captured for the advising checklist app. It is intended as a discussion artifact for future work with administrators and advisors.")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append("| Core Area | Requirement IDs Used In App | Structure | Required Courses | Required Credits | Catalog Courses Captured |")
    lines.append("| --- | --- | --- | ---: | ---: | ---: |")

    for area in data["areas"]:
        requirement_ids = ", ".join(f"`{item}`" for item in area["requirementIds"])
        structure = "Tiered" if is_tiered(area) else "Single-area"
        lines.append(
            f"| {md_escape(area['name'])} | {requirement_ids} | {structure} | "
            f"{area['requiredCourses']} | {area['requiredCredits']} | {area_course_count(area)} |"
        )

    lines.append("")
    lines.append("## Notes For Advising Checklist Integration")
    lines.append("")
    lines.append("- Not all Core Areas are tiered. Artistic, Writing, Ethics, and Quantitative are single-area requirements.")
    lines.append("- Historical, Literary, Philosophical, Scientific, Societal/Cultural, and Theological/Religious are tiered areas with Foundational/Tier I and Tier II course lists.")
    lines.append("- Department-code histograms count catalog-listed courses by the prefix before the course number, such as `COMP`, `HIST`, or `THEO`.")
    lines.append("- For tiered areas, histograms and department tables break counts out by catalog section.")
    lines.append("- Many catalog tables list hours at the requirement/group level rather than on each individual course row. For this application inventory, blank course-level hours are treated as 3 credits by default; explicit catalog row values, such as UCWR 109 at 6 credits, are preserved.")
    lines.append("- Courses marked with a diversity designation in the catalog are noted with `Yes` in the Diversity column.")
    lines.append("- This inventory is a catalog-derived starting point. It should be confirmed with advising/admin stakeholders before driving official degree-audit behavior.")
    lines.append("")
    lines.append("## Core Areas And Courses")
    lines.append("")

    for area in data["areas"]:
        chart_path = write_svg(area)
        png_path, renderer = render_png(chart_path)
        chart_paths[area["id"]] = {"svg": chart_path, "png": png_path}

        lines.append(f"### {area['name']}")
        lines.append("")
        lines.append(f"Source: {area['sourceUrl']}")
        lines.append("")
        lines.append(f"Requirement IDs used in app: {', '.join(f'`{item}`' for item in area['requirementIds'])}")
        lines.append("")
        lines.append(f"Required courses: {area['requiredCourses']}")
        lines.append("")
        lines.append(f"Required credits: {area['requiredCredits']}")
        lines.append("")
        lines.append(f"![{area['name']} department histogram PNG]({png_path.as_posix()})")
        lines.append("")
        lines.append(f"Chart files: [PNG]({png_path.as_posix()}) | [SVG]({chart_path.as_posix()})")
        lines.append("")
        lines.append("#### Department Counts")
        lines.append("")
        write_department_table(lines, area)

        for group in area["groups"]:
            lines.append(f"#### {group['label']}")
            lines.append("")
            write_course_table(lines, group)

    OUTPUT_PATH.write_text("\n".join(lines) + "\n")
    write_html(data, chart_paths)
    total_courses = sum(area_course_count(area) for area in data["areas"])
    print(
        f"Wrote {OUTPUT_PATH} and {HTML_OUTPUT_PATH} with {len(data['areas'])} areas, {total_courses} courses, "
        f"and {len(data['areas'])} SVG/PNG chart pairs using {renderer}."
    )


if __name__ == "__main__":
    main()
