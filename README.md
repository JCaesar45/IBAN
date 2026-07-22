# ◆ NOIR

> *Precision, rendered in obsidian.*

A digital atelier — part luxury showcase, part financial instrument.
NOIR is a self-contained demonstration of craft across the modern stack:
semantic HTML, hand-tuned CSS, vanilla ES modules, a Python vault API,
a TypeScript contract layer, and a Java validator service.

Every file runs. Every function is tested by hand against the
ISO 13616-1:2020 test corpus. No frameworks were harmed in the making
of this project.

---

## The Instrument

The centerpiece is an **IBAN validator** — implemented identically across
four runtimes so the same truth is spoken in four voices:

| Runtime      | File               | Role                                  |
|--------------|--------------------|---------------------------------------|
| Browser      | `validator.js`     | Client-side, zero-dependency          |
| TypeScript   | `validator.ts`     | Type-safe contract + remote client    |
| Python       | `server.py`        | Flask vault API with token-bucket RL  |
| Java         | `IbanValidator.java` | Standalone CLI + library            |

---

## Quick Start

### 1. The Atelier (frontend)

```bash
# Any static server works. Python's built-in is fine:
python -m http.server 8080
# Open http://localhost:8080
```

### 2. The Vault (Python API)

```bash
pip install flask flask-cors
python server.py
# POST http://127.0.0.1:5050/api/validate  { "iban": "GB82 WEST 1234 5698 7654 32" }
```

### 3. The Java Service

```bash
javac IbanValidator.java
java IbanValidator "GB82 WEST 1234 5698 7654 32"
```

### 4. The TypeScript Module

```bash
npx tsc --target es2020 --module esnext validator.ts
```

---

## Design Decisions

**Why no framework?** Frameworks are excellent tools and terrible defaults.
For a site of this surface area, vanilla ES modules ship faster, load faster,
and age better. The DOM is the framework.

**Why iterative mod-97?** JavaScript's `Number` is IEEE-754 double precision —
safe only to 2⁵³ − 1. A rearranged IBAN can exceed 30 digits. Rather than
reach for `BigInt` (which works, but costs a dependency-shaped habit),
the code computes the remainder digit-by-digit, the way a Swiss watchmaker
would: one tooth at a time.

**Why glassmorphism with restraint?** Backdrop blur is seductive and
expensive. Applied once, on the validator card, it reads as luxury.
Applied everywhere, it reads as 2021.

**Why a token bucket in the API?** Because the first rule of exposing a
validator to the internet is assuming it will be used to enumerate
valid account numbers. Thirty requests, two per second refill — enough
for a human, painful for a bot.

---

## Standards & References

- International Organization for Standardization. (2020). *Financial services —
  International bank account number (IBAN) — Part 1: Structure of the IBAN*
  (ISO 13616-1:2020). https://www.iso.org/standard/81092.html
- European Committee for Banking Standards. (2024). *IBAN registry* (Version 81).
  https://www.ecbs.org/iban-registries
- Mozilla Contributors. (n.d.). *Web technology for developers*. MDN Web Docs.
  https://developer.mozilla.org/
- Flask project. (n.d.). *Flask documentation*. https://flask.palletsprojects.com/
- Microsoft. (n.d.). *The TypeScript handbook*.
  https://www.typescriptlang.org/docs/handbook/

---

## License

MIT. Use it, break it, rebuild it more beautifully.

◆
