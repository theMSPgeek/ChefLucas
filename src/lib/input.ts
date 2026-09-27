const EMAIL =
  /^[A-Z0-9._%+-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const PHONE = /^\+?[0-9][0-9 ().-]{6,18}[0-9]$/;
const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]{0,79}$/u;
const PRODUCT_ID = /^[A-Za-z0-9_-]{8,80}$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function cleanSingleLine(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function cleanMultiline(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function isPersonName(value: string) {
  return PERSON_NAME.test(value);
}

export function isEmailAddress(value: string) {
  return value.length <= 254 && EMAIL.test(value);
}

export function isPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && PHONE.test(value);
}

export function isProductId(value: string) {
  return PRODUCT_ID.test(value);
}

export function isPriceId(value: string) {
  return PRODUCT_ID.test(value);
}

export function isIsoDate(value: string) {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 2024 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

export function isGuestCount(value: string) {
  if (!/^\d{1,4}$/.test(value)) return false;
  const count = Number(value);
  return count >= 1 && count <= 5000;
}
