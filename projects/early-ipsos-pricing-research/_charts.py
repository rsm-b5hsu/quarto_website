"""Generate the synthetic charts for the Ipsos pricing-research demo page.

All data here is synthetic, created for a fictional coffee-subscription
brand ("Brewly"). Nothing is derived from any client study.

Run:  /opt/anaconda3/bin/python projects/early-ipsos-pricing-research/_charts.py
"""
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).parent
ACCENT = "#2780e3"
DARK = "#343a40"
GREY = "#adb5bd"
LIGHT_ACCENT = "#9cc5f2"

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

rng = np.random.default_rng(42)


# ---------------------------------------------------------------- Van Westendorp
def van_westendorp():
    n = 1000
    # Each synthetic respondent gives four monthly price thresholds (USD),
    # ordered too_cheap < cheap < expensive < too_expensive.
    base = rng.lognormal(mean=np.log(18), sigma=0.30, size=n)
    too_cheap = base * rng.uniform(0.55, 0.80, n)
    cheap = base * rng.uniform(0.80, 1.00, n)
    expensive = base * rng.uniform(1.00, 1.25, n)
    too_expensive = base * rng.uniform(1.25, 1.65, n)

    prices = np.linspace(5, 40, 701)
    # Share of respondents for whom price p is "too cheap" / "cheap" (falls with price)
    s_too_cheap = np.array([(too_cheap >= p).mean() for p in prices])
    s_cheap = np.array([(cheap >= p).mean() for p in prices])
    # Share for whom price p is "expensive" / "too expensive" (rises with price)
    s_expensive = np.array([(expensive <= p).mean() for p in prices])
    s_too_exp = np.array([(too_expensive <= p).mean() for p in prices])

    def cross(a, b):
        i = np.argmin(np.abs(a - b))
        return prices[i]

    pmc = cross(s_too_cheap, s_expensive)   # point of marginal cheapness
    pme = cross(s_cheap, s_too_exp)         # point of marginal expensiveness
    opp = cross(s_too_cheap, s_too_exp)     # optimal price point
    ipp = cross(s_cheap, s_expensive)       # indifference price point

    fig, ax = plt.subplots(figsize=(8, 4.8))
    ax.axvspan(pmc, pme, color=ACCENT, alpha=0.08, lw=0)
    ax.plot(prices, s_too_cheap, color=ACCENT, lw=2, ls="--", label="Too cheap")
    ax.plot(prices, s_cheap, color=ACCENT, lw=2, label="Cheap / good value")
    ax.plot(prices, s_expensive, color=DARK, lw=2, label="Expensive")
    ax.plot(prices, s_too_exp, color=DARK, lw=2, ls="--", label="Too expensive")

    for x, lab, ha in [(pmc, "Lower bound", "right"), (pme, "Upper bound", "left")]:
        ax.axvline(x, color="#6c757d", lw=0.8, ls=":")
        ax.text(x, 1.02, f"{lab} ${x:.0f}", ha=ha, va="bottom", fontsize=9, color=DARK)
    ax.scatter([opp, ipp], [np.interp(opp, prices, s_too_cheap), np.interp(ipp, prices, s_cheap)],
               color=ACCENT, zorder=5, s=28)
    ax.annotate(f"Optimal price point ≈ ${opp:.0f}", (opp, np.interp(opp, prices, s_too_cheap)),
                xytext=(opp - 12, 0.55), fontsize=9, color=DARK,
                arrowprops=dict(arrowstyle="-", color="#6c757d", lw=0.8))
    ax.annotate(f"Indifference price ≈ ${ipp:.0f}", (ipp, np.interp(ipp, prices, s_cheap)),
                xytext=(ipp + 4, 0.72), fontsize=9, color=DARK,
                arrowprops=dict(arrowstyle="-", color="#6c757d", lw=0.8))
    ax.text((pmc + pme) / 2, 0.90, "Acceptable\nprice range", ha="center", va="top", fontsize=9,
            color=ACCENT, bbox=dict(boxstyle="round,pad=0.2", fc="white", ec="none", alpha=0.85))

    ax.set_xlim(5, 40)
    ax.set_ylim(0, 1)
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{v:.0%}"))
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"${v:.0f}"))
    ax.set_xlabel("Monthly subscription price (synthetic)")
    ax.set_ylabel("Share of respondents")
    ax.legend(frameon=False, loc="center right", fontsize=9)
    fig.tight_layout()
    fig.savefig(OUT / "van_westendorp.svg")
    plt.close(fig)
    return dict(pmc=pmc, pme=pme, opp=opp, ipp=ipp)


# ---------------------------------------------------------------- Conjoint
PARTWORTHS = {
    "Price / month": {"$12": 0.9, "$16": 0.3, "$20": -0.3, "$24": -0.9},
    "Coffee package": {"2 bags": -0.5, "3 bags": 0.1, "3 bags + gear": 0.4},
    "Brand": {"Brewly": 0.25, "Store brand": -0.25},
    "Service": {"Fixed schedule": -0.3, "Pause/skip anytime": 0.3},
}


def conjoint():
    ranges = {a: max(v.values()) - min(v.values()) for a, v in PARTWORTHS.items()}
    total = sum(ranges.values())
    imp = {a: r / total for a, r in ranges.items()}
    order = sorted(imp, key=imp.get)

    fig, ax = plt.subplots(figsize=(8, 2.8))
    colors = [ACCENT if a == order[-1] else GREY for a in order]
    ax.barh(order, [imp[a] for a in order], color=colors, height=0.6)
    for i, a in enumerate(order):
        ax.text(imp[a] + 0.01, i, f"{imp[a]:.0%}", va="center", fontsize=9, color=DARK)
    ax.set_xlim(0, max(imp.values()) * 1.2)
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda v, _: f"{v:.0%}"))
    ax.set_xlabel("Relative attribute importance (synthetic)")
    fig.tight_layout()
    fig.savefig(OUT / "conjoint_importance.svg")
    plt.close(fig)

    fig, axes = plt.subplots(1, 4, figsize=(10, 3), sharey=True)
    for ax, (attr, levels) in zip(axes, PARTWORTHS.items()):
        names, vals = list(levels), list(levels.values())
        ax.bar(names, vals, color=[ACCENT if v > 0 else GREY for v in vals], width=0.6)
        ax.axhline(0, color="#6c757d", lw=0.8)
        ax.set_title(attr, fontsize=10, color=DARK)
        ax.tick_params(axis="x", labelrotation=30, labelsize=8)
        for lbl in ax.get_xticklabels():
            lbl.set_ha("right")
    axes[0].set_ylabel("Part-worth utility")
    fig.tight_layout()
    fig.savefig(OUT / "conjoint_partworths.svg")
    plt.close(fig)

    # Share-of-preference simulation (logit rule) for three candidate packages
    packages = {
        "Basic: 2 bags, $12": ("$12", "2 bags", "Brewly", "Fixed schedule"),
        "Core: 3 bags, $16, flexible": ("$16", "3 bags", "Brewly", "Pause/skip anytime"),
        "Premium: 3 bags + gear, $24": ("$24", "3 bags + gear", "Brewly", "Pause/skip anytime"),
    }
    attrs = list(PARTWORTHS)
    u = {k: sum(PARTWORTHS[a][lvl] for a, lvl in zip(attrs, v)) for k, v in packages.items()}
    e = {k: np.exp(v) for k, v in u.items()}
    share = {k: v / sum(e.values()) for k, v in e.items()}
    return imp, share


if __name__ == "__main__":
    vw = van_westendorp()
    imp, share = conjoint()
    print("Van Westendorp:", {k: round(v, 1) for k, v in vw.items()})
    print("Importance:", {k: round(v, 3) for k, v in imp.items()})
    print("Share of preference:", {k: round(v, 3) for k, v in share.items()})
