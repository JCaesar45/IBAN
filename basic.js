function isValid(iban) {
  // Remove all whitespace and convert to uppercase
  iban = iban.replace(/\s/g, '').toUpperCase();

  // Format check: 2 letters + 2 digits + at least 1 alphanumeric
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) {
    return false;
  }

  // Length check (max 34 characters)
  if (iban.length > 34) {
    return false;
  }

  // Move the first 4 characters to the end
  const rearranged = iban.slice(4) + iban.slice(0, 4);

  // Convert letters to numbers (A=10, B=11, ..., Z=35)
  let numericStr = '';
  for (let i = 0; i < rearranged.length; i++) {
    const ch = rearranged[i];
    if (ch >= 'A' && ch <= 'Z') {
      numericStr += (ch.charCodeAt(0) - 55).toString();
    } else {
      numericStr += ch;
    }
  }

  // Compute modulo 97 iteratively (number can be up to ~62 digits long)
  let remainder = 0;
  for (let i = 0; i < numericStr.length; i++) {
    remainder = (remainder * 10 + parseInt(numericStr[i], 10)) % 97;
  }

  return remainder === 1;
}
