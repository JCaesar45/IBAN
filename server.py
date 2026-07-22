"""
NOIR — Vault API
A Flask microservice exposing IBAN validation over HTTPS.
Run: python server.py
"""

from __future__ import annotations
import re
import time
from dataclasses import dataclass
from typing import Optional

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix


# ---------- Domain ----------

# ISO 13616-1:2020 registry — expected IBAN lengths per country
LENGTHS: dict[str, int] = {
    "AL":28,"AD":24,"AT":20,"AZ":28,"BH":22,"BY":28,"BE":16,"BA":20,"BR":29,
    "BG":22,"CR":22,"HR":21,"CY":28,"CZ":24,"DK":18,"DO":28,"TL":23,"EE":20,
    "FO":18,"FI":18,"FR":27,"GE":22,"DE":22,"GI":23,"GR":27,"GL":18,"GT":28,
    "HU":28,"IS":26,"IQ":23,"IE":22,"IL":23,"IT":27,"JO":30,"KZ":20,"XK":20,
    "KW":30,"LV":21,"LB":28,"LI":21,"LT":20,"LU":20,"MK":19,"MT":31,"MR":27,
    "MU":30,"MC":27,"MD":24,"ME":22,"NL":18,"NO":15,"PK":24,"PS":29,"PL":28,
    "PT":25,"QA":29,"RO":24,"LC":32,"SM":27,"SA":24,"RS":22,"SC":31,"SK":24,
    "SI":19,"ES":24,"SE":24,"CH":21,"TN":24,"TR":26,"UA":29,"AE":23,"GB":22,
    "VG":24,
}

BBAN_PATTERN = re.compile(r"^[A-Z]{2}[0-9]{2}[A-Z0-9]+$")


@dataclass(frozen=True)
class ValidationResult:
    valid: bool
    country: Optional[str] = None
    checksum: Optional[str] = None
    reason: Optional[str] = None

    def to_dict(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v is not None or k == "valid"}


def _mod97(numeric: str) -> int:
    remainder = 0
    for ch in numeric:
        remainder = (remainder * 10 + (ord(ch) - 48)) % 97
    return remainder


def _to_numeric(rearranged: str) -> Optional[str]:
    out: list[str] = []
    for ch in rearranged:
        code = ord(ch)
        if 48 <= code <= 57:
            out.append(ch)
        elif 65 <= code <= 90:
            out.append(str(code - 55))
        else:
            return None
    return "".join(out)


def validate_iban(raw: str) -> ValidationResult:
    iban = re.sub(r"\s+", "", (raw or "").upper())

    if len(iban) < 2:
        return ValidationResult(False, reason="Too short")
    if not iban[:2].isalpha():
        return ValidationResult(False, reason="Invalid country code")

    country = iban[:2]
    if not BBAN_PATTERN.match(iban):
        return ValidationResult(False, reason="Malformed BBAN")
    if len(iban) > 34:
        return ValidationResult(False, reason="Exceeds 34 characters")

    expected = LENGTHS.get(country)
    if expected is not None and len(iban) != expected:
        return ValidationResult(False, reason=f"Expected {expected} chars for {country}")

    rearranged = iban[4:] + iban[:4]
    numeric = _to_numeric(rearranged)
    if numeric is None:
        return ValidationResult(False, reason="Invalid characters")

    checksum = _mod97(numeric)
    if checksum != 1:
        return ValidationResult(False, reason="Checksum failed (mod-97 ≠ 1)")

    return ValidationResult(True, country=country, checksum=iban[2:4])


# ---------- Rate limit (in-memory, per-process) ----------

class TokenBucket:
    def __init__(self, capacity: int, refill_per_sec: float):
        self.capacity = capacity
        self.tokens = float(capacity)
        self.refill = refill_per_sec
        self.last = time.monotonic()

    def allow(self) -> bool:
        now = time.monotonic()
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.refill)
        self.last = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False


bucket = TokenBucket(capacity=30, refill_per_sec=2.0)


# ---------- App ----------

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.get("/health")
def health():
    return jsonify(status="operational", service="noir-vault", version="1.0.0")


@app.post("/api/validate")
def api_validate():
    if not bucket.allow():
        return jsonify(valid=False, reason="Rate limit exceeded"), 429

    payload = request.get_json(silent=True) or {}
    iban = payload.get("iban", "")
    if not isinstance(iban, str):
        return jsonify(valid=False, reason="iban must be a string"), 400

    result = validate_iban(iban)
    return jsonify(result.to_dict())


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5050, debug=False)
