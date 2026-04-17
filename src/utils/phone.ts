export function digitsOnly(input: string) {
  return String(input ?? '').replace(/\D/g, '');
}

export function toINLocalMobileDigits(input: string) {
  let d = digitsOnly(input);
  if (!d) return '';

  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
  if (d.length > 10) d = d.slice(-10);
  return d.slice(0, 10);
}

export function toE164IN(input: string) {
  const local = toINLocalMobileDigits(input);
  return local ? `+91${local}` : '';
}

export function formatINForDisplay(input: string) {
  const local = toINLocalMobileDigits(input);
  if (!local) return '+91';
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

