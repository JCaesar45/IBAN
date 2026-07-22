/*
 * NOIR — IBAN Validator Service
 * Pure Java 17+. No Spring dependency required to run standalone.
 *
 * Compile: javac IbanValidator.java
 * Run:     java IbanValidator "GB82 WEST 1234 5698 7654 32"
 */

import java.util.Map;
import java.util.regex.Pattern;

public final class IbanValidator {

    public record Result(boolean valid, String country, String checksum, String reason) {
        public static Result ok(String country, String checksum) {
            return new Result(true, country, checksum, null);
        }
        public static Result fail(String reason) {
            return new Result(false, null, null, reason);
        }
    }

    private static final Map<String, Integer> LENGTHS = Map.ofEntries(
        Map.entry("AL",28), Map.entry("AD",24), Map.entry("AT",20), Map.entry("AZ",28),
        Map.entry("BH",22), Map.entry("BY",28), Map.entry("BE",16), Map.entry("BA",20),
        Map.entry("BR",29), Map.entry("BG",22), Map.entry("CR",22), Map.entry("HR",21),
        Map.entry("CY",28), Map.entry("CZ",24), Map.entry("DK",18), Map.entry("DO",28),
        Map.entry("TL",23), Map.entry("EE",20), Map.entry("FO",18), Map.entry("FI",18),
        Map.entry("FR",27), Map.entry("GE",22), Map.entry("DE",22), Map.entry("GI",23),
        Map.entry("GR",27), Map.entry("GL",18), Map.entry("GT",28), Map.entry("HU",28),
        Map.entry("IS",26), Map.entry("IQ",23), Map.entry("IE",22), Map.entry("IL",23),
        Map.entry("IT",27), Map.entry("JO",30), Map.entry("KZ",20), Map.entry("XK",20),
        Map.entry("KW",30), Map.entry("LV",21), Map.entry("LB",28), Map.entry("LI",21),
        Map.entry("LT",20), Map.entry("LU",20), Map.entry("MK",19), Map.entry("MT",31),
        Map.entry("MR",27), Map.entry("MU",30), Map.entry("MC",27), Map.entry("MD",24),
        Map.entry("ME",22), Map.entry("NL",18), Map.entry("NO",15), Map.entry("PK",24),
        Map.entry("PS",29), Map.entry("PL",28), Map.entry("PT",25), Map.entry("QA",29),
        Map.entry("RO",24), Map.entry("LC",32), Map.entry("SM",27), Map.entry("SA",24),
        Map.entry("RS",22), Map.entry("SC",31), Map.entry("SK",24), Map.entry("SI",19),
        Map.entry("ES",24), Map.entry("SE",24), Map.entry("CH",21), Map.entry("TN",24),
        Map.entry("TR",26), Map.entry("UA",29), Map.entry("AE",23), Map.entry("GB",22),
        Map.entry("VG",24)
    );

    private static final Pattern BBAN = Pattern.compile("^[A-Z]{2}[0-9]{2}[A-Z0-9]+$");

    private IbanValidator() {}

    public static Result validate(String raw) {
        if (raw == null) return Result.fail("Null input");
        String iban = raw.replaceAll("\\s+", "").toUpperCase();

        if (iban.length() < 2) return Result.fail("Too short");
        char c0 = iban.charAt(0), c1 = iban.charAt(1);
        if (!Character.isLetter(c0) || !Character.isLetter(c1)) {
            return Result.fail("Invalid country code");
        }

        String country = iban.substring(0, 2);
        if (!BBAN.matcher(iban).matches()) return Result.fail("Malformed BBAN");
        if (iban.length() > 34) return Result.fail("Exceeds 34 characters");

        Integer expected = LENGTHS.get(country);
        if (expected != null && iban.length() != expected.intValue()) {
            return Result.fail("Expected " + expected + " chars for " + country);
        }

        String rearranged = iban.substring(4) + iban.substring(0, 4);
        StringBuilder numeric = new StringBuilder(rearranged.length() * 2);
        for (int i = 0; i < rearranged.length(); i++) {
            char ch = rearranged.charAt(i);
            if (ch >= '0' && ch <= '9') numeric.append(ch);
            else if (ch >= 'A' && ch <= 'Z') numeric.append((int) ch - 55);
            else return Result.fail("Invalid characters");
        }

        int remainder = 0;
        for (int i = 0; i < numeric.length(); i++) {
            remainder = (remainder * 10 + (numeric.charAt(i) - '0')) % 97;
        }
        if (remainder != 1) return Result.fail("Checksum failed (mod-97 ≠ 1)");

        return Result.ok(country, iban.substring(2, 4));
    }

    public static void main(String[] args) {
        if (args.length == 0) {
            System.err.println("Usage: java IbanValidator \"<IBAN>\"");
            System.exit(1);
        }
        Result r = validate(args[0]);
        System.out.println(r);
        System.exit(r.valid() ? 0 : 2);
    }
}
