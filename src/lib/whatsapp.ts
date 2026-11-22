/** WhatsApp click-to-chat links. The message opens ready to send, from the admin's own WhatsApp. */
export function phoneDigits(raw?: string | null) {
  let d = (raw ?? "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = `91${d}`; // Indian mobile numbers are often saved without the country code
  return d.length >= 11 && d.length <= 15 ? d : "";
}

/** With no usable number, WhatsApp lets the sender pick the contact. */
export function waLink(phone: string | undefined | null, text: string) {
  const to = phoneDigits(phone);
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}
