"""Generate the synthetic charts for the KPMG SROI / investment-case demo page.

All values are synthetic, for a fictional environmental-education program and a
fictional smart-streetlight rollout. Nothing reproduces any client's model,
costs, contract structure, or forecast.

Run:  /opt/anaconda3/bin/python projects/early-kpmg-sroi-investment/_charts.py
"""
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).parent
ACCENT = "#2780e3"
DARK = "#343a40"
GREY = "#adb5bd"

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 10,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.edgecolor": "#6c757d",
    "axes.labelcolor": DARK,
    "xtick.color": DARK,
    "ytick.color": DARK,
    "svg.fonttype": "none",
})


# ------------------------------------------------ Program components: value per $
def program_components():
    # Synthetic: share of program cost and monetized social value per component
    comps = {
        "School workshops": (0.30, 0.42),
        "Field trips": (0.25, 0.18),
        "Teacher training": (0.15, 0.22),
        "Printed materials": (0.20, 0.06),
        "Online modules": (0.10, 0.12),
    }
    total_value_per_dollar = 3.0  # synthetic program-level SROI (value : cost)
    names = list(comps)
    sroi = {n: total_value_per_dollar * v / c for n, (c, v) in comps.items()}
    order = sorted(names, key=sroi.get)

    fig, ax = plt.subplots(figsize=(8, 3.2))
    colors = [GREY if sroi[n] < total_value_per_dollar else ACCENT for n in order]
    ax.barh(order, [sroi[n] for n in order], color=colors, height=0.6)
    ax.axvline(total_value_per_dollar, color=DARK, lw=1, ls="--")
    ax.text(total_value_per_dollar, len(order) - 0.4, "  program average", fontsize=9, color=DARK, va="center")
    for i, n in enumerate(order):
        ax.text(sroi[n] + 0.08, i, f"{sroi[n]:.1f}", va="center", fontsize=9, color=DARK)
    ax.set_xlabel("Social value created per $1 invested (synthetic)")
    ax.set_xlim(0, max(sroi.values()) * 1.2)
    fig.tight_layout()
    fig.savefig(OUT / "sroi_components.svg")
    plt.close(fig)
    return sroi


# ------------------------------------------------ Streetlight deployment scenarios
def streetlight_scenarios():
    """Two views of the same three synthetic deployment scenarios.

    Left: a first-look metric (year-1 service revenue per light, indexed) that
    makes rural look least attractive. Right: 10-year cumulative net cash flow
    per $ of upfront investment from a simple P&L model, which changes the ranking.
    """
    years = np.arange(0, 11)
    scen = {  # synthetic, indexed: upfront capex, annual net benefit, year-1 uptake
        "Urban": dict(capex=100, net=22, ramp=1.0, rev1=100),
        "Suburban": dict(capex=90, net=16, ramp=1.0, rev1=72),
        "Rural": dict(capex=55, net=13.5, ramp=0.7, rev1=45),
    }
    names = list(scen)
    ret, payback = {}, {}
    for n, p in scen.items():
        cash = [-p["capex"]]
        for y in years[1:]:
            cash.append(cash[-1] + p["net"] * (p["ramp"] if y == 1 else 1.0))
        cash = np.array(cash)
        ret[n] = cash[-1] / p["capex"]
        payback[n] = int(years[np.argmax(cash >= 0)])

    fig, (a1, a2) = plt.subplots(1, 2, figsize=(9, 3.4))
    a1.bar(names, [scen[n]["rev1"] for n in names], color=[GREY, GREY, GREY], width=0.6)
    a1.set_title("First look: year-1 revenue per light", fontsize=10, color=DARK)
    a1.set_ylabel("Index (urban = 100)")
    for i, n in enumerate(names):
        a1.text(i, scen[n]["rev1"] + 2, f"{scen[n]['rev1']}", ha="center", fontsize=9, color=DARK)
    a1.set_ylim(0, 120)

    cols = [GREY, GREY, ACCENT]
    a2.bar(names, [ret[n] for n in names], color=cols, width=0.6)
    a2.set_title("Full P&L view: 10-yr net return per $ invested", fontsize=10, color=DARK)
    a2.set_ylabel("Net cash ÷ upfront investment")
    for i, n in enumerate(names):
        a2.text(i, ret[n] + 0.04, f"{ret[n]:.2f}×\npayback yr {payback[n]}", ha="center", va="bottom",
                fontsize=8.5, color=DARK)
    a2.set_ylim(0, max(ret.values()) * 1.35)
    fig.tight_layout(w_pad=3)
    fig.savefig(OUT / "streetlight_scenarios.svg")
    plt.close(fig)
    return {n: dict(return_per_dollar=round(ret[n], 2), payback=payback[n]) for n in names}


if __name__ == "__main__":
    print("Component SROI:", {k: round(v, 2) for k, v in program_components().items()})
    print("Streetlight:", streetlight_scenarios())
