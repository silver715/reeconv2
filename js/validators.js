// Validaciones: comprobación de formato y seguridad de contraseñas

/**
 * Valida que la contraseña cumpla con:
 * - Mínimo 6 caracteres
 * - Al menos 1 letra mayúscula (A-Z)
 * - Al menos 1 letra minúscula (a-z)
 * - Al menos 1 número (0-9)
 */
export function validatePassword(pw) {
  if (!pw || pw.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres 🔐";
  }
  if (!/[A-Z]/.test(pw)) {
    return "La contraseña debe incluir al menos una letra MAYÚSCULA (A-Z) 🔠";
  }
  if (!/[a-z]/.test(pw)) {
    return "La contraseña debe incluir al menos una letra minúscula (a-z) 🔡";
  }
  if (!/[0-9]/.test(pw)) {
    return "La contraseña debe incluir al menos un número (0-9) 🔢";
  }
  return null;
}

/**
 * Normaliza el identificador a un correo electrónico válido
 */
export function normalizeEmail(input) {
  const clean = (input || "").trim();
  if (clean.includes("@")) {
    return clean.toLowerCase();
  }
  const safeUser = clean.toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return safeUser + "@racoon.local";
}
