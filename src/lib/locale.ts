export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export function formatFaNumber(value: number): string {
  return toFaDigits(value.toLocaleString('en-US'));
}
