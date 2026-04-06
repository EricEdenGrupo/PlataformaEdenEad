/** Maps `identity.profiles.street` (rua + número num único campo) ↔ formulário em PT-BR. */

export function splitStreetForForm(street: string | null | undefined): { logradouro: string; numero: string } {
  const s = (street ?? "").trim();
  if (!s) return { logradouro: "", numero: "" };
  const m = s.match(/^(.*?),\s*([^,]+)$/u);
  if (m) return { logradouro: m[1].trim(), numero: m[2].trim() };
  return { logradouro: s, numero: "" };
}

export function joinStreetFromForm(logradouro: string, numero: string): string {
  const l = logradouro.trim();
  const n = numero.trim();
  if (!l) return "";
  return n ? `${l}, ${n}` : l;
}
