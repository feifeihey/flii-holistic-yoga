#!/usr/bin/env python3
"""
Build a full-year booking-schedule.json (all 12 months) from the weekly pattern.

Usage:
  python3 generate-booking-year.py 2026
  python3 generate-booking-year.py 2026 --extra schedule-extras.json

The booking page shows one month at a time; visitors use ‹ › to change months.
"""

from __future__ import annotations

import json
import sys
from calendar import monthrange
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT_JSON = ROOT / "booking-schedule.json"
OUT_JS = ROOT / "booking-schedule.js"

TIME = {"en": "7:00–8:15", "zh": "7:00–8:15"}
TEACHER = {"en": "Feifei", "zh": "菲菲"}
ONLINE = {"en": "Online", "zh": "线上"}
SPOTS = 12

WEEKLY = {
    0: ("hatha", "Hatha Yoga", "哈他瑜伽"),
    1: ("hatha", "Hatha Yoga", "哈他瑜伽"),
    2: ("vinyasa", "Vinyasa Yoga", "流瑜伽"),
    3: ("hatha", "Hatha Yoga", "哈他瑜伽"),
    4: ("hatha", "Hatha Yoga", "哈他瑜伽"),
    5: ("yin", "Yin Yoga", "阴瑜伽"),
    6: None,
}


def build_month(year: int, month: int) -> list[dict]:
    import datetime

    _, days = monthrange(year, month)
    events = []
    for day in range(1, days + 1):
        wd = datetime.date(year, month, day).weekday()
        slot = WEEKLY.get(wd)
        if not slot:
            continue
        key, title_en, title_zh = slot
        iso = f"{year:04d}-{month:02d}-{day:02d}"
        events.append(
            {
                "id": f"{iso}-{key}",
                "date": iso,
                "time": TIME,
                "title": {"en": title_en, "zh": title_zh},
                "category": "yoga",
                "teacher": TEACHER,
                "location": ONLINE,
                "spots": SPOTS,
            }
        )
    return events


def load_extras(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and "events" in data:
        return data["events"]
    raise SystemExit("Extra file must be a JSON array or { \"events\": [...] }")


def write_outputs(payload: dict) -> None:
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    js = "// Auto-generated — full-year schedule\n"
    js += "window.FLII_BOOKING_SCHEDULE = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n"
    OUT_JS.write_text(js, encoding="utf-8")


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = [a for a in sys.argv[1:] if a.startswith("--")]
    if not args:
        print(__doc__)
        sys.exit(1)

    year = int(args[0])
    events: list[dict] = []
    for month in range(1, 13):
        events.extend(build_month(year, month))

    if "--extra" in flags:
        idx = sys.argv.index("--extra")
        extra_path = Path(sys.argv[idx + 1]) if idx + 1 < len(sys.argv) else None
        if not extra_path or not extra_path.is_file():
            sys.exit("Use --extra path/to/schedule-extras.json")
        by_id = {e["id"]: e for e in events}
        for ev in load_extras(extra_path):
            by_id[ev["id"]] = ev
        events = sorted(by_id.values(), key=lambda e: (e["date"], e.get("id", "")))

    payload = {
        "year": year,
        "timezone": {"en": "Beijing Time (GMT+8)", "zh": "北京时间（GMT+8）"},
        "events": events,
    }
    write_outputs(payload)
    print(f"Wrote {len(events)} events for {year} → {OUT_JSON.name} & {OUT_JS.name}")


if __name__ == "__main__":
    main()
