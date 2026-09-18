"""CDC / SCD Type-2 dimension merges."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, Sequence


@dataclass(frozen=True)
class UserDim:
    user_id: str
    plan: str
    region: str
    valid_from_ms: int
    valid_to_ms: Optional[int]
    is_current: bool
    version: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "user_id": self.user_id,
            "plan": self.plan,
            "region": self.region,
            "valid_from_ms": self.valid_from_ms,
            "valid_to_ms": self.valid_to_ms,
            "is_current": self.is_current,
            "version": self.version,
        }


@dataclass(frozen=True)
class UserChange:
    user_id: str
    plan: str
    region: str
    change_time_ms: int


def apply_scd2(existing: Sequence[UserDim], changes: Sequence[UserChange]) -> list[UserDim]:
    """Apply ordered CDC changes. Same attributes → no new version."""
    by_user: dict[str, list[UserDim]] = {}
    for row in existing:
        by_user.setdefault(row.user_id, []).append(row)

    ordered = sorted(changes, key=lambda c: (c.change_time_ms, c.user_id))
    for ch in ordered:
        hist = by_user.setdefault(ch.user_id, [])
        current = next((r for r in hist if r.is_current), None)
        if current is None:
            hist.append(UserDim(
                user_id=ch.user_id, plan=ch.plan, region=ch.region,
                valid_from_ms=ch.change_time_ms, valid_to_ms=None,
                is_current=True, version=1,
            ))
            continue
        if current.plan == ch.plan and current.region == ch.region:
            continue
        if ch.change_time_ms < current.valid_from_ms:
            # Late CDC: still close current and open new version at change time
            # for didactic clarity; production systems may reject or reorder.
            pass
        closed = UserDim(
            user_id=current.user_id, plan=current.plan, region=current.region,
            valid_from_ms=current.valid_from_ms, valid_to_ms=ch.change_time_ms,
            is_current=False, version=current.version,
        )
        opened = UserDim(
            user_id=ch.user_id, plan=ch.plan, region=ch.region,
            valid_from_ms=ch.change_time_ms, valid_to_ms=None,
            is_current=True, version=current.version + 1,
        )
        hist = [r for r in hist if not r.is_current] + [closed, opened]
        by_user[ch.user_id] = hist

    out: list[UserDim] = []
    for hist in by_user.values():
        out.extend(sorted(hist, key=lambda r: (r.user_id, r.version)))
    return out


def as_of(rows: Sequence[UserDim], user_id: str, t_ms: int) -> Optional[UserDim]:
    candidates = [
        r for r in rows
        if r.user_id == user_id
        and r.valid_from_ms <= t_ms
        and (r.valid_to_ms is None or t_ms < r.valid_to_ms)
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda r: r.version)
