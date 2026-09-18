from link.physics import ber_from_snr_db, diagnose_lane, simulate_lane, software_loss_is_not_ber
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


def test_build(tmp_path):
    out = build(tmp_path)
    assert (out / "cases.json").exists()
