from link.physics import ber_from_snr_db, diagnose_lane, fec_histogram, simulate_lane, software_loss_is_not_ber
from link.cases import all_cases, build


def test_ber_falls_with_snr():
    assert ber_from_snr_db(25) < ber_from_snr_db(12)


def test_healthy_diagnosed():
    d = diagnose_lane(simulate_lane(0, impairment="healthy"))
    assert d["label"] == "healthy"


def test_snr_fade_diagnosed():
    d = diagnose_lane(simulate_lane(1, impairment="snr_fade"))
    assert d["label"] == "signal_integrity_degrade"


def test_flap_diagnosed():
    d = diagnose_lane(simulate_lane(3, impairment="flap"))
    assert d["label"] == "link_flap"


def test_software_loss_claim_false():
    assert software_loss_is_not_ber(10)["valid"] is False


def test_optical_case_present():
    ids = {c["id"] for c in all_cases()}
    assert any("optical" in i for i in ids)
    assert "not_netem" in ids
    assert "jitter_dominated_electrical" in ids


def test_jitter_diagnosed():
    d = diagnose_lane(simulate_lane(6, impairment="jitter_dominated"))
    assert d["label"] == "jitter_limited"


def test_link_health_score_healthy_high():
    d = diagnose_lane(simulate_lane(0, impairment="healthy"))
    assert d["link_health"]["score"] >= 70
    assert d["link_health"]["band"] in ("green", "amber")


def test_link_health_score_fade_lower():
    healthy = diagnose_lane(simulate_lane(0, impairment="healthy"))["link_health"]["score"]
    faded = diagnose_lane(simulate_lane(1, impairment="snr_fade"))["link_health"]["score"]
    assert faded < healthy


def test_fec_histogram_counts():
    rows = simulate_lane(1, impairment="snr_fade")
    hist = fec_histogram(rows)
    assert hist["n"] == len(rows)
    assert sum(hist["counts"]) == len(rows)


def test_equalization_adapts_on_fade():
    d = diagnose_lane(simulate_lane(1, impairment="snr_fade"))
    assert d["equalization"]["ctle_db"] is not None
    assert d["equalization"]["adapting"] is True


def test_build(tmp_path):
    out = build(tmp_path)
    assert (out / "cases.json").exists()
    cases = all_cases()
    assert any(c.get("fec_histogram") for c in cases if c["id"] != "not_netem")
