#!/usr/bin/env python3
"""List phrases from the LLM-tics checklist in the site text. It flags candidates only.
Run from the repo folder:  python3 tools/prose-scan.py"""
import glob, re
FILES = [f for f in glob.glob('js/*.js') if f.split('/')[-1] not in
         ('ml.js', 'plot.js', 'tables.js', 'cnnlab.js', 'samlab.js', 'seismic.js', 'data.js')] + ['index.html', 'README.md', 'LECTURE-PLAN.md']
PATS = {
    'voice words': r"\b(worth|sits?|sitting|rather than|instead|chain|tradeoff|trade-off|payoff)\b",
    'importance words': r"\b(important|importantly|crucial|significant|significantly|noteworthy|compelling|fascinating|remarkabl\w+|striking|substantial|profound|transformative|groundbreaking|unprecedented|promising|exciting|intriguing|illuminating|insightful|valuable)\b",
    'not X but Y': r"(not only|not merely|not simply|more than just|goes beyond|extends beyond)",
    'promotional': r"\b(elegant|powerful|sophisticated|cutting-edge|state-of-the-art|game-chang\w+|revolutionary|versatile|robust|novel|handy)\b",
    'generic complexity': r"\b(multifaceted|intricate|nuanced|heterogeneous|interconnected|landscape|ecosystem|paradigm|toolkit|roadmap|journey)\b",
    'empty verbs': r"\b(serves? (to|as)|plays? a (key|crucial|role)|provides? insight|offers? insight|sheds? light|underscores?|leverag\w+|facilitat\w+|delv\w+)\b",
    'enthusiasm openers': r"\b(interestingly|surprisingly|notably|indeed|fascinatingly|excitingly|intriguingly)\b",
    'meta or transition': r"(in this section|in this context|it is (important|worth)|as we can see|taken together|overall,|moving forward|with this in mind|against this backdrop|first and foremost)",
    'stacked hedges': r"\b(may potentially|could possibly|might perhaps|could potentially)\b",
    'em dash': r"\u2014",
    'dramatic colon': r"(the reason is|the key point|the implication is)",
    'stock idioms': r"(half the battle|tip of the iceberg|double-edged|bridge the gap|pave the way|game changer|at the forefront|building block)",
    'question hook': r"hook: '[^']*\?",
}
n = 0
for f in FILES:
    for i, line in enumerate(open(f, encoding='utf8'), 1):
        for name, pat in PATS.items():
            for m in re.finditer(pat, line, flags=re.I):
                n += 1
                print(f"{f}:{i}: [{name}] ...{line.strip()[max(0, m.start() - 40):m.end() + 40]}...")
print(f"\n{n} candidates. Each one needs a human decision: some are the right word.")
