# Corrected photos

Output of `tools/flatten.py` with its default settings (strength 1.0, detail 3.0, crease 1.0):
uneven lighting and fold edges evened out, nothing painted in. Source photos stay in `photos/`
(not committed).

- `2026-10-21/` — from `photos/Oct21_2026_addition/`. 18527 rotated 270°, 18533 rotated 180°.

To redo one:

    .venv/bin/python tools/flatten.py photos/Oct21_2026_addition/18527.JPG processed/2026-10-21/18527.jpg --rotate 270

Set up the environment once with `python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt`.
