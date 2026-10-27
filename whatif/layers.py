#!/usr/bin/env python3
"""Layered-kernel diagram of the proposed CS BS major (61 credits).

Writes whatif/out/proposed-layers.svg (and a 300-dpi PNG fallback).
Run:  uv run --with matplotlib python whatif/layers.py
"""
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

HERE = Path(__file__).parent
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)

# Text becomes outlines so the slide looks identical on machines without the font.
plt.rcParams["svg.fonttype"] = "path"
plt.rcParams["font.family"] = "sans-serif"
plt.rcParams["font.sans-serif"] = ["Avenir Next", "Helvetica Neue", "Arial", "DejaVu Sans"]

# --- tokens -----------------------------------------------------------------
SURFACE = "#fcfcfb"
INK, INK2, INK3 = "#0b0b0b", "#52514e", "#8a8984"
MAROON, SLATE = "#8a1c2b", "#3a3f4b"
GOLD, GOLD_TINT = "#c99700", "#fbf1d0"

# course-areas.json is the source of truth for area membership; the lists below
# are the examples shown on the slide (code, short name; "+" marks a 1-credit course).
AREAS = [  # (json area, label, categorical hue slots 1-6 in fixed order, examples)
    ("Theory", "Theory", "#2a78d6",
     [(363, "Algorithms"), (376, "Automata"), (350, "Applied Crypto"),
      (331, "Crypto Math"), (328, "Coding Theory"), (309, "Numerical Meth.")]),
    ("Languages and Systems", "Languages\n& Systems", "#eb6834",
     [(310, "Operating Systems"), (362, "Architecture"), (371, "Prog. Languages"),
      (335, "Formal Methods"), (353, "Database Prog."), (343, "Networks")]),
    ("Software Engineering", "Software\nEngineering", "#1baf7a",
     [(330, "Software Eng."), (313, "OO Design"), (332, "Requirements"),
      (370, "Software Quality"), (312, "Open Source")]),
    ("Applications", "Applications", "#eda100",
     [(323, "Game Design"), (341, "HCI"), (380, "Graphics"),
      (306, "Data Mining"), (358, "Big Data"), (387, "Deep Learning")]),
    ("AI", "AI", "#e87ba4", [(378, "Artificial Intel."), (379, "Machine Learning")]),
    ("Life Skills", "Life Skills", "#008300",
     [(377, "IT Proj. Mgmt"), (395, "Career Growth+"), (397, "Research Meth.+"),
      (390, "Broadening Part.+"), (314, "Problem Solving+")]),
    ("Ethics", "Ethics", "#6250d6", [(317, "Ethics")]),
]
WEIGHT = {"Ethics": 0.7}  # tile width relative to a normal area tile
SHOWN = 6  # max rows per tile; remainder summarised as "+ N more"

catalog = {int(c["id"][4:]): c["area"] for c in json.load(open(HERE / "course-areas.json"))}
for key, _, _, ex in AREAS:
    for n, _name in ex:
        assert catalog[n] == key, f"COMP {n} is {catalog[n]!r}, not {key!r}"
total_in = {k: sum(1 for a in catalog.values() if a == k) for k, *_ in AREAS}


def tint(hex_color, amount=0.14):
    r, g, b = (int(hex_color[i : i + 2], 16) for i in (1, 3, 5))
    mix = lambda c: round(255 * (1 - amount) + c * amount)
    return f"#{mix(r):02x}{mix(g):02x}{mix(b):02x}"


fig = plt.figure(figsize=(13.333, 7.5), facecolor=SURFACE)
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, 160)
ax.set_ylim(0, 90)
ax.axis("off")


def box(x, y, w, h, fc, ec="none", lw=0, ls="-", r=1.2, z=1):
    ax.add_patch(
        FancyBboxPatch(
            (x, y), w, h, boxstyle=f"round,pad=0,rounding_size={r}",
            fc=fc, ec=ec, lw=lw, ls=ls, zorder=z,
        )
    )


def text(x, y, s, size=9, color=INK, weight="normal", ha="center", va="center", z=5, **kw):
    ax.text(x, y, s, fontsize=size, color=color, fontweight=weight, ha=ha, va=va, zorder=z, **kw)


X0, W = 30.0, 126.0  # layer area
GAP = 1.2  # gap between tiles (surface-coloured spacer)

# --- title ------------------------------------------------------------------
text(4, 85.5, "A kernel, then layers", size=26, weight="bold", ha="left")
text(4, 80.6, "Proposed CS BS major: 60 credits (61 today). "
     "Core, language and CAS requirements are unchanged.", size=11.5, color=INK2, ha="left")

# draft banner (top right)
box(121.5, 83.2, 34.5, 5.2, tint(GOLD, 0.18), ec=GOLD, lw=1.1, r=2.4, z=2)
text(138.75, 85.8, "DRAFT FOR DISCUSSION", size=10.5, weight="bold")
text(156, 80.6, "Final courses and areas are subject to review.", size=9.5, color=INK2, ha="right")

# --- layer geometry (top to bottom) ----------------------------------------
layers = {  # name: (y, h)
    "experience": (61.3, 14.0),
    "areas": (27.8, 32.0),
    "kernel": (6.5, 19.0),
}


def gutter(key, label, credits, sub):
    y, h = layers[key]
    cy = y + h / 2
    text(4, cy + 3.0, label, size=13, weight="bold", ha="left")
    text(4, cy - 0.4, f"{credits} credits", size=10, color=INK2, ha="left")
    text(4, cy - 3.4, sub, size=8.5, color=INK3, ha="left")


gutter("experience", "Experience", 15, "depth + practicum / capstone")
gutter("areas", "Breadth", 21, "ethics + 1 from each of 6 areas")
gutter("kernel", "Kernel", 24, "required of everyone")

# --- kernel -----------------------------------------------------------------
ky, kh = layers["kernel"]
box(X0 - 1, ky - 1, W + 2, kh + 2, tint(MAROON, 0.07), r=2, z=0)
tiles = [  # (credits, fill, big, small, group)
    (6, SLATE, "MATH", "131/132 or\n161/162", "Calculus"),
    (3, MAROON, "COMP 163", "Discrete\nStructures", "Foundation sequence"),
    (3, MAROON, "COMP 170", "Object-Oriented\nProgramming", "Foundation sequence"),
    (3, MAROON, "COMP 264", "Computer\nSystems", "Foundation sequence"),
    (3, MAROON, "COMP 271", "Data\nStructures I", "Foundation sequence"),
    (3, SLATE, "STAT 203", "Probability &\nStatistics", "Statistics"),
    (3, MAROON, "COMP 272\nor 280*", "Theory track or\nAI track", "Advanced 200-level"),
]
unit = (W - GAP * (len(tiles) - 1)) / sum(t[0] for t in tiles)
x = X0
group_span = {}
for cr, fc, big, small, group in tiles:
    w = cr * unit
    th = kh - 5.5
    ty = ky + 5.5
    box(x, ty, w, th, fc, z=2)
    if "280" in big:  # proposed course: dashed light ring
        box(x + 0.5, ty + 0.5, w - 1, th - 1, "none", ec=GOLD_TINT, lw=1.4, ls=(0, (3, 2)), r=1, z=3)
    text(x + w / 2, ty + th * 0.68, big, size=12.5 if "\n" not in big else 11, color="white", weight="bold")
    text(x + w / 2, ty + th * 0.26, small, size=8.2, color="#f3e3e5", linespacing=1.15)
    lo, hi = group_span.get(group, (x, x))
    group_span[group] = (min(lo, x), x + w)
    x += w + GAP
for group, (lo, hi) in group_span.items():  # group caption + bracket under tiles
    ax.plot([lo + 0.5, hi - 0.5], [ky + 3.7, ky + 3.7], color=INK3, lw=0.9, zorder=3, solid_capstyle="round")
    text((lo + hi) / 2, ky + 1.4, group, size=8.8, color=INK2)

# --- areas ------------------------------------------------------------------
ay, ah = layers["areas"]
wsum = sum(WEIGHT.get(k, 1.0) for k, *_ in AREAS)
aunit = (W - GAP * (len(AREAS) - 1)) / wsum
ax0 = X0
for key, label, hue, ex in AREAS:
    aw = aunit * WEIGHT.get(key, 1.0)
    box(ax0, ay, aw, ah, tint(hue, 0.13), z=2)
    box(ax0, ay + ah - 1.5, aw, 1.5, hue, r=0.6, z=3)  # identity stripe
    text(ax0 + aw / 2, ay + ah - 5.8, label, size=10.5, weight="bold", linespacing=1.1)
    text(ax0 + aw / 2, ay + ah - 10.0, "required  ·  3 cr" if key == "Ethics" else "pick one  ·  3 cr",
         size=8.2, color=INK2)
    rows = ex[:SHOWN]
    for j, (n, name) in enumerate(rows):
        yy = ay + ah - 13.6 - j * 2.6
        text(ax0 + 1.3, yy, str(n), size=8.2, weight="bold", ha="left")
        text(ax0 + 4.6, yy, name, size=8.2, color=INK2, ha="left")
    more = total_in[key] - len(rows)
    note = (f"+ {more} more" if more > 0 else
            "these two only" if key == "AI" else
            "everyone takes it" if key == "Ethics" else None)
    if note:
        text(ax0 + 1.3, ay + 1.9, note, size=8.2, color=INK3, ha="left", style="italic")
    ax0 += aw + GAP

# --- experience: one dashed box around depth + practicum + internship -------
ey, eh = layers["experience"]
box(X0, ey, W, eh, "none", ec=INK3, lw=1.3, ls=(0, (4, 3)), r=1.6, z=1)
PAD = 1.4
inner_w = W - 2 * PAD - GAP
dw, pw = inner_w * 9 / 15, inner_w * 6 / 15
ty, th = ey + PAD, eh - 2 * PAD
x = X0 + PAD
box(x, ty, dw, th, "white", ec="#cfcec9", lw=0.9, z=2)
text(x + dw / 2, ty + th * 0.64, "3 more 300-level courses", size=12, weight="bold")
text(x + dw / 2, ty + th * 0.30, "any area  ·  9 cr", size=8.8, color=INK2)
x += dw + GAP
box(x, ty, pw, th, GOLD_TINT, ec=GOLD, lw=1.2, z=2)
text(x + pw / 2, ty + th * 0.64, "Practicum / Capstone", size=12, weight="bold")
text(x + pw / 2, ty + th * 0.30, "6 cr total  ·  COMP 398 Independent Study + COMP 391 Internship",
     size=8.2, color=INK2)

# --- capstone bracket along the right edge ---------------------------------
bx = X0 + W + 1.6
top, bot = ey + eh, ay
ax.plot([bx - 0.8, bx, bx, bx - 0.8], [top, top, bot, bot], color=GOLD, lw=1.6, zorder=3,
        solid_capstyle="round", solid_joinstyle="round")
text(bx + 1.1, (top + bot) / 2, "every 300-level course offers a capstone experience",
     size=9, color=INK2, rotation=270)

# --- footer -----------------------------------------------------------------
text(4, 2.6, "* COMP 280 is a proposed new course (assumed 3 credits).   + 1-credit course.   "
     "Examples drawn from the 2026–27 catalog; each tile lists a sample of its area.",
     size=8.2, color=INK3, ha="left")

fig.savefig(OUT / "proposed-layers.svg", facecolor=SURFACE)
fig.savefig(OUT / "proposed-layers.png", dpi=300, facecolor=SURFACE)
print("wrote", OUT / "proposed-layers.svg")
