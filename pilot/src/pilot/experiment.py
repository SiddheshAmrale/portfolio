"""Live Linux experiments.

Ground truth is written to a sidecar file. Observations never include the
injector label. Software netem on a veth pair is not an optical impairment.

The client and server run in separate network namespaces so TCP actually
traverses the veth. Same-host sockets would otherwise bypass netem.
"""

from __future__ import annotations

import ctypes
import hashlib
import http.client
import json
import multiprocessing
import os
import random
import subprocess
import threading
import time
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Optional

from . import linux
from .diagnosis import diagnose, naive_network_blame, time_to_detect
from .evaluate import EvalReport, EvalRow, _map_truth
from .schema import Observation, counter, gauge, missing
from .store import read_parquet, write_parquet

VETH_A = "pilot0"
VETH_B = "pilot1"
ADDR_A = "10.200.42.1"
ADDR_B = "10.200.42.2"
PORT = 18080
NS_C = "pilotc"
NS_S = "pilots"
CLONE_NEWNET = 0x40000000
CGROUP = "/sys/fs/cgroup/pilot-exp"
SOFTWARE = "pilot 0.2.1"
CONDITIONS = ("healthy", "delay", "loss", "cpu", "stale", "mixed")


@dataclass
class AppStats:
    lock: threading.Lock = field(default_factory=threading.Lock)
    requests: int = 0
    timeouts: int = 0
    nbytes: int = 0
    last_latency_ms: float = 0.0
    latencies: list[float] = field(default_factory=list)

    def record(self, latency_ms: float, nbytes: int, ok: bool) -> None:
        with self.lock:
            if ok:
                self.requests += 1
                self.nbytes += nbytes
                self.last_latency_ms = latency_ms
                self.latencies.append(latency_ms)
            else:
                self.timeouts += 1
                self.latencies.append(latency_ms)

    def snapshot(self) -> tuple[int, int, int, float]:
        with self.lock:
            lat = self.last_latency_ms
            return self.requests, self.timeouts, self.nbytes, lat

    def window(self, start: int, end: int) -> list[float]:
        with self.lock:
            return list(self.latencies[start:end])


def _sudo(args: list[str], input_text: str | None = None) -> subprocess.CompletedProcess:
    cmd = ["sudo", "-n", *args]
    return subprocess.run(cmd, input=input_text, text=True, capture_output=True, check=False)


def _ns(ns: str, args: list[str]) -> subprocess.CompletedProcess:
    return _sudo(["ip", "netns", "exec", ns, *args])


def _burn(n: int = 12000) -> None:
    h = b"pilot"
    for _ in range(n):
        h = hashlib.sha256(h).digest()


def _make_handler():
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt: str, *args: Any) -> None:
            return

        def do_GET(self) -> None:  # noqa: N802
            _burn()
            body = b"ok"
            self.send_response(200)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            self.wfile.write(body)

    return Handler


def _setns(ns: str) -> None:
    libc = ctypes.CDLL("libc.so.6", use_errno=True)
    fd = os.open("/var/run/netns/" + ns, os.O_RDONLY)
    try:
        if libc.setns(fd, CLONE_NEWNET) != 0:
            err = ctypes.get_errno()
            raise OSError(err, "setns " + ns)
    finally:
        os.close(fd)


def _server_in_ns(host: str, port: int) -> None:
    _setns(NS_S)
    server = ThreadingHTTPServer((host, port), _make_handler())
    server.allow_reuse_address = True
    server.serve_forever()


def teardown_netns() -> None:
    _ns(NS_C, ["tc", "qdisc", "del", "dev", VETH_A, "root"])
    _ns(NS_S, ["tc", "qdisc", "del", "dev", VETH_B, "root"])
    _sudo(["ip", "netns", "del", NS_C])
    _sudo(["ip", "netns", "del", NS_S])
    _sudo(["ip", "link", "del", VETH_A])
    _sudo(["ip", "link", "del", VETH_B])


def setup_netns() -> None:
    teardown_netns()
    for ns in (NS_C, NS_S):
        r = _sudo(["ip", "netns", "add", ns])
        if r.returncode != 0:
            raise RuntimeError("ip netns add " + ns + " failed: " + (r.stderr or r.stdout))
    r = _sudo(["ip", "link", "add", VETH_A, "type", "veth", "peer", "name", VETH_B])
    if r.returncode != 0:
        raise RuntimeError("ip link add veth failed: " + (r.stderr or r.stdout))
    r = _sudo(["ip", "link", "set", VETH_A, "netns", NS_C])
    if r.returncode != 0:
        raise RuntimeError("move " + VETH_A + " failed: " + (r.stderr or r.stdout))
    r = _sudo(["ip", "link", "set", VETH_B, "netns", NS_S])
    if r.returncode != 0:
        raise RuntimeError("move " + VETH_B + " failed: " + (r.stderr or r.stdout))
    for ns, dev, addr in ((NS_C, VETH_A, ADDR_A), (NS_S, VETH_B, ADDR_B)):
        r = _ns(ns, ["ip", "addr", "add", addr + "/24", "dev", dev])
        if r.returncode != 0:
            raise RuntimeError("addr add failed: " + (r.stderr or r.stdout))
        _ns(ns, ["ip", "link", "set", "lo", "up"])
        r = _ns(ns, ["ip", "link", "set", dev, "up"])
        if r.returncode != 0:
            raise RuntimeError("link up failed for " + dev + ": " + (r.stderr or ""))


def apply_netem(delay_ms: int = 0, loss_pct: float = 0.0) -> None:
    for ns, dev in ((NS_C, VETH_A), (NS_S, VETH_B)):
        if delay_ms or loss_pct:
            args = ["tc", "qdisc", "replace", "dev", dev, "root", "netem"]
            if delay_ms:
                args += ["delay", str(delay_ms) + "ms"]
            if loss_pct:
                args += ["loss", str(loss_pct) + "%"]
            r = _ns(ns, args)
            if r.returncode != 0:
                raise RuntimeError("netem failed on " + ns + "/" + dev + ": " + (r.stderr or r.stdout))
        else:
            _ns(ns, ["tc", "qdisc", "del", "dev", dev, "root"])


def setup_cgroup(pid: int, quota_us: int = 20000, period_us: int = 100000) -> bool:
    _sudo(["sh", "-c", "echo +cpu > /sys/fs/cgroup/cgroup.subtree_control || true"])
    r = _sudo(["mkdir", "-p", CGROUP])
    if r.returncode != 0:
        return False
    r = _sudo(["tee", CGROUP + "/cpu.max"], input_text=str(quota_us) + " " + str(period_us) + "\n")
    if r.returncode != 0:
        return False
    r = _sudo(["tee", CGROUP + "/cgroup.procs"], input_text=str(pid) + "\n")
    return r.returncode == 0


def clear_cgroup(pid: int) -> None:
    _sudo(["tee", "/sys/fs/cgroup/cgroup.procs"], input_text=str(pid) + "\n")
    _sudo(["rmdir", CGROUP])


def _client_loop(host: str, port: int, stats: AppStats, stop: threading.Event) -> None:
    _setns(NS_C)
    conn: http.client.HTTPConnection | None = None
    while not stop.is_set():
        t0 = time.perf_counter()
        ok = False
        n = 0
        try:
            if conn is None:
                conn = http.client.HTTPConnection(host, port, timeout=2.0)
            conn.request("GET", "/")
            resp = conn.getresponse()
            n = len(resp.read())
            ok = resp.status == 200
        except (TimeoutError, OSError, http.client.HTTPException):
            ok = False
            if conn is not None:
                try:
                    conn.close()
                except Exception:
                    pass
                conn = None
        dt = (time.perf_counter() - t0) * 1000.0
        stats.record(dt, n, ok)
    if conn is not None:
        try:
            conn.close()
        except Exception:
            pass


def _wait_ready(host: str, port: int, timeout_s: float = 5.0) -> None:
    ready = threading.Event()
    err: dict[str, str] = {"e": "timeout"}

    def probe() -> None:
        try:
            _setns(NS_C)
        except OSError as e:
            err["e"] = str(e)
            return
        t0 = time.time()
        while time.time() - t0 < timeout_s:
            conn = None
            try:
                conn = http.client.HTTPConnection(host, port, timeout=0.4)
                conn.request("GET", "/")
                conn.getresponse().read()
                ready.set()
                return
            except (TimeoutError, OSError, http.client.HTTPException) as e:
                err["e"] = str(e)
                time.sleep(0.05)
            finally:
                if conn is not None:
                    try:
                        conn.close()
                    except Exception:
                        pass

    t = threading.Thread(target=probe, daemon=True)
    t.start()
    if not ready.wait(timeout_s + 0.5):
        raise RuntimeError("server not reachable via netns veth: " + err["e"])


def _mean(xs: list[float]) -> Optional[float]:
    if not xs:
        return None
    return sum(xs) / len(xs)


def confirm_impairment(condition: str, warmup: list[float], impaired: list[float],
                       missing_rx: bool) -> tuple[bool, str]:
    w = _mean(warmup) or 0.0
    i = _mean(impaired) or 0.0
    if condition == "healthy":
        return True, "healthy; mean latency " + f"{i:.1f}" + " ms"
    if condition == "stale":
        return missing_rx, "stale missing_rx=" + str(missing_rx)
    if i >= w * 1.4 + 8.0:
        return True, "latency " + f"{w:.1f}" + " -> " + f"{i:.1f}" + " ms"
    return False, "workload did not move: " + f"{w:.1f}" + " -> " + f"{i:.1f}" + " ms"


def scrape(run_id: str, seq: int, epoch: int, stats: AppStats, server_pid: int,
           prev_ticks: Optional[int], prev_t_ms: Optional[int],
           stale: bool) -> tuple[list[Observation], Optional[int], int]:
    t_obs = linux._now_ms()
    net_dev = "/proc/" + str(server_pid) + "/net/dev"
    net_snmp = "/proc/" + str(server_pid) + "/net/snmp"
    rows = linux.collect_linux(
        run_id, "linux-live", seq, epoch,
        net_dev_path=net_dev, net_snmp_path=net_snmp,
    )
    t_arr = linux._now_ms()
    req, to, nb, lat = stats.snapshot()
    ticks = linux.read_pid_ticks(server_pid)
    rss = linux.read_pid_rss_bytes(server_pid)
    cpu = None
    if ticks is not None and prev_ticks is not None and prev_t_ms is not None:
        dt = max((t_obs - prev_t_ms) / 1000.0, 1e-6)
        cpu = 100.0 * ((ticks - prev_ticks) / linux.clk_tck()) / dt
    throttled = linux.read_cgroup_throttled_usec(CGROUP)

    extra: list[Observation] = [
        counter(run_id, "linux-live", "app", "app_requests_total", float(req), t_obs, t_arr, seq, epoch, "app:requests", unit="1"),
        counter(run_id, "linux-live", "app", "app_timeouts_total", float(to), t_obs, t_arr, seq, epoch, "app:timeouts", unit="1"),
        counter(run_id, "linux-live", "app", "app_bytes_total", float(nb), t_obs, t_arr, seq, epoch, "app:bytes", unit="B"),
        gauge(run_id, "linux-live", "app", "app_latency_ms", lat, t_obs, t_arr, seq, epoch, "app:client-rtt", unit="ms"),
        gauge(run_id, "linux-live", "collector", "collector_lag_ms", float(t_arr - t_obs), t_obs, t_arr, seq, epoch, "collector:lag", unit="ms"),
    ]
    if cpu is not None:
        extra.append(gauge(run_id, "linux-live", "proc", "proc_cpu_percent", cpu, t_obs, t_arr, seq, epoch, "linux:/proc/" + str(server_pid) + "/stat", unit="%"))
    if rss is not None:
        extra.append(gauge(run_id, "linux-live", "proc", "proc_rss_bytes", float(rss), t_obs, t_arr, seq, epoch, "linux:/proc/" + str(server_pid) + "/statm", unit="B"))
    if throttled is not None:
        extra.append(counter(run_id, "linux-live", "cgroup", "cgroup_cpu_throttled_usec", float(throttled), t_obs, t_arr, seq, epoch, "linux:" + CGROUP + "/cpu.stat", unit="us"))

    if stale:
        kept = []
        for r in rows:
            if r.metric in ("rx_bytes", "TcpRetransSegs") or (r.interface in (VETH_A, VETH_B) and r.metric_type == "counter"):
                kept.append(missing(run_id, r.source_id, r.interface, r.metric, t_obs, t_arr, seq, epoch, r.source_ref, unit=r.unit, metric_type=r.metric_type))
            else:
                kept.append(r)
        rows = kept
        extra = [
            gauge(run_id, "linux-live", "app", "app_latency_ms", lat, t_obs, t_arr, seq, epoch, "app:client-rtt", unit="ms"),
            gauge(run_id, "linux-live", "collector", "collector_lag_ms", 5000.0, t_obs, t_arr, seq, epoch, "collector:paused", unit="ms"),
            counter(run_id, "linux-live", "app", "app_requests_total", float(req), t_obs, t_arr, seq, epoch, "app:requests", unit="1"),
        ]
    return rows + extra, ticks, t_obs


def run_one(run_id: str, condition: str, duration_s: float = 7.0, warmup_s: float = 1.6,
            interval_s: float = 0.2) -> dict[str, Any]:
    stats = AppStats()
    setup_netns()
    ctx = multiprocessing.get_context("fork")
    proc = ctx.Process(target=_server_in_ns, args=(ADDR_B, PORT), daemon=True)
    proc.start()
    server_pid = proc.pid
    if not server_pid:
        teardown_netns()
        raise RuntimeError("server process failed to start")
    try:
        _wait_ready(ADDR_B, PORT)
    except Exception:
        proc.terminate()
        proc.join(timeout=3)
        teardown_netns()
        raise
    stop = threading.Event()
    workers = []
    for _ in range(4):
        t = threading.Thread(target=_client_loop, args=(ADDR_B, PORT, stats, stop), daemon=True)
        t.start()
        workers.append(t)

    cgroup_ok = False
    applied = False
    rows: list[Observation] = []
    prev_ticks = linux.read_pid_ticks(server_pid)
    prev_t = linux._now_ms()
    n_warmup = 0
    t_end = time.time() + duration_s
    seq = 0
    try:
        while time.time() < t_end:
            elapsed = duration_s - (t_end - time.time())
            if elapsed >= warmup_s and not applied:
                applied = True
                n_warmup = len(stats.latencies)
                if condition in ("delay",):
                    apply_netem(delay_ms=80)
                elif condition in ("loss",):
                    apply_netem(loss_pct=15.0)
                elif condition == "mixed":
                    apply_netem(loss_pct=12.0)
                    cgroup_ok = setup_cgroup(server_pid)
                elif condition == "cpu":
                    cgroup_ok = setup_cgroup(server_pid)
                elif condition == "stale":
                    apply_netem(delay_ms=80)
                elif condition == "healthy":
                    pass
            stale = condition == "stale" and applied and elapsed < warmup_s + 2.2
            chunk, prev_ticks, prev_t = scrape(run_id, seq, 0, stats, server_pid, prev_ticks, prev_t, stale)
            rows.extend(chunk)
            seq += 1
            time.sleep(interval_s)
    finally:
        stop.set()
        for t in workers:
            t.join(timeout=1.0)
        proc.terminate()
        proc.join(timeout=3)
        apply_netem(0, 0)
        if cgroup_ok:
            clear_cgroup(server_pid)
        teardown_netns()

    warmup = stats.window(0, n_warmup or max(1, len(stats.latencies) // 4))
    impaired = stats.window(n_warmup, len(stats.latencies))
    miss = any(r.metric == "rx_bytes" and r.collection_status == "missing" for r in rows)
    confirmed, confirm_detail = confirm_impairment(condition, warmup, impaired, miss)
    if condition == "cpu" and not cgroup_ok:
        confirmed, confirm_detail = False, "cgroup cpu.max setup failed"

    d = diagnose(rows)
    return {
        "run_id": run_id,
        "software": SOFTWARE,
        "linux_proc_available": True,
        "path": "netns-veth",
        "condition": condition,
        "diagnosis": d.label,
        "baseline_diagnosis": naive_network_blame(rows),
        "time_to_detect_seq": time_to_detect(rows),
        "impairment_confirmed": confirmed,
        "confirm_detail": confirm_detail,
        "cgroup_ok": cgroup_ok,
        "n_obs": len(rows),
        "warmup_latency_ms": _mean(warmup),
        "impaired_latency_ms": _mean(impaired),
        "notes": d.notes,
        "evidence": [{"name": e.name, "present": e.present, "detail": e.detail} for e in d.evidence],
        "missing_evidence": d.missing_evidence,
        "rows": rows,
    }


def run_linux_suite(out_dir: str | Path, repeats: int = 2, seed: int = 7,
                    duration_s: float = 7.0) -> Path:
    if not linux.linux_available():
        raise RuntimeError("Linux /proc is required for live experiments")
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    jobs = [(cond, i) for i in range(repeats) for cond in CONDITIONS]
    random.Random(seed).shuffle(jobs)
    truth_path = out / "ground_truth.jsonl"
    if truth_path.exists():
        truth_path.unlink()
    manifest: list[dict[str, Any]] = []
    for cond, i in jobs:
        run_id = "live-" + cond + "-" + str(i)
        result = run_one(run_id, cond, duration_s=duration_s)
        rows: list[Observation] = result.pop("rows")
        run_dir = out / "runs" / run_id
        run_dir.mkdir(parents=True, exist_ok=True)
        write_parquet(rows, run_dir / "obs.parquet")
        meta = dict(result)
        (run_dir / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
        sidecar = {
            "run_id": run_id,
            "condition": cond,
            "impairment_confirmed": result["impairment_confirmed"],
            "confirm_detail": result["confirm_detail"],
        }
        with truth_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(sidecar) + "\n")
        for r in rows:
            dumped = r.to_dict()
            if "condition" in dumped:
                raise RuntimeError("injector condition leaked into an observation")
        manifest.append({
            "run_id": run_id,
            "parquet": str((run_dir / "obs.parquet").as_posix()),
            "meta": str((run_dir / "meta.json").as_posix()),
            "n_obs": result["n_obs"],
        })
    (out / "manifest.json").write_text(json.dumps({
        "software": SOFTWARE,
        "seed": seed,
        "repeats": repeats,
        "duration_s": duration_s,
        "path": "netns-veth",
        "disclaimer": "Live Linux netns+veth+netem+cgroup. Packets traverse a veth; software packet loss is not optical BER/FEC. Ground truth is ground_truth.jsonl only.",
        "runs": manifest,
    }, indent=2), encoding="utf-8")
    return out


def evaluate_linux_dir(linux_dir: str | Path) -> EvalReport:
    """Apply frozen rules to live runs. Ground truth is read only here."""
    root = Path(linux_dir)
    rows: list[EvalRow] = []
    for line in (root / "ground_truth.jsonl").read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        truth = json.loads(line)
        obs = read_parquet(root / "runs" / truth["run_id"] / "obs.parquet")
        pred = diagnose(obs).label
        if not truth.get("impairment_confirmed", True):
            continue
        rows.append(EvalRow(truth["run_id"], _map_truth(truth["condition"]), pred, "linux-live"))
    n = len(rows)
    insufficient = sum(1 for r in rows if r.predicted == "insufficient_evidence")
    diagnosed = [r for r in rows if r.predicted != "insufficient_evidence"]
    correct = [r for r in diagnosed if r.predicted == r.truth]
    network_false = sum(
        1 for r in rows
        if r.truth in ("receiver_cpu", "healthy") and r.predicted in ("network_loss", "network_delay")
    )
    missed = sum(
        1 for r in rows
        if r.truth in ("network_loss", "network_delay", "receiver_cpu") and r.predicted == "healthy"
    )
    return EvalReport(
        rows=rows,
        diagnosed_pct=(len(diagnosed) / n) if n else 0.0,
        accuracy_when_diagnosed=(len(correct) / len(diagnosed)) if diagnosed else 0.0,
        network_false_attr=network_false,
        missed_impaired=missed,
        insufficient=insufficient,
        n=n,
    )
