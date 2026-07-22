// IBAN validation — ISO 13616-1:2020
// Pure function, zero dependencies.

export const IBANValidator = (() => {
    // Per-country expected lengths (ISO 13616 registry, partial)
    const LENGTHS = {
        AL:28, AD:24, AT:20, AZ:28, BH:22, BY:28, BE:16, BA:20, BR:29,
        BG:22, CR:22, HR:21, CY:28, CZ:24, DK:18, DO:28, TL:23, EE:20,
        FO:18, FI:18, FR:27, GE:22, DE:22, GI:23, GR:27, GL:18, GT:28,
        HU:28, IS:26, IQ:23, IE:22, IL:23, IT:27, JO:30, KZ:20, XK:20,
        KW:30, LV:21, LB:28, LI:21, LT:20, LU:20, MK:19, MT:31, MR:27,
        MU:30, MC:27, MD:24, ME:22, NL:18, NO:15, PK:24, PS:29, PL:28,
        PT:25, QA:29, RO:24, LC:32, SM:27, SA:24, RS:22, SC:31, SK:24,
        SI:19, ES:24, SE:24, CH:21, TN:24, TR:26, UA:29, AE:23, GB:22,
        VG:24,
    };

    function clean(value) {
        return String(value || '').replace(/\s+/g, '').toUpperCase();
    }

    function mod97(numericString) {
        // Iterative mod to avoid BigInt overflow on long strings
        let remainder = 0;
        for (let i = 0; i < numericString.length; i++) {
            remainder = (remainder * 10 + (numericString.charCodeAt(i) - 48)) % 97;
        }
        return remainder;
    }

    function toNumeric(rearranged) {
        let out = '';
        for (let i = 0; i < rearranged.length; i++) {
            const c = rearranged.charCodeAt(i);
            if (c >= 48 && c <= 57) out += rearranged[i];
            else if (c >= 65 && c <= 90) out += (c - 55).toString();
            else return null; // non-IBAN character
        }
        return out;
    }

    function validate(raw) {
        const iban = clean(raw);

        if (iban.length < 2) return { valid: false, reason: 'Too short' };
        if (!/^[A-Z]{2}/.test(iban)) return { valid: false, reason: 'Invalid country code' };

        const country = iban.slice(0, 2);
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) {
            return { valid: false, reason: 'Malformed BBAN' };
        }
        if (iban.length > 34) return { valid: false, reason: 'Exceeds 34 characters' };

        const expected = LENGTHS[country];
        if (expected && iban.length !== expected) {
            return { valid: false, reason: `Expected ${expected} chars for ${country}` };
        }

        const rearranged = iban.slice(4) + iban.slice(0, 4);
        const numeric = toNumeric(rearranged);
        if (numeric === null) return { valid: false, reason: 'Invalid characters' };

        const checksum = mod97(numeric);
        return {
            valid: checksum === 1,
            country,
            checksum: iban.slice(2, 4),
            reason: checksum === 1 ? null : 'Checksum failed (mod-97 ≠ 1)',
        };
    }

    return { validate, LENGTHS };
})();
