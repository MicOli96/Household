export type AuthMode = "login" | "register";

export type AuthErrors = {
  username?: string;
  password?: string;
  confirmPassword?: string;
};

export function validateAuth(
  mode: AuthMode,
  username: string,
  password: string,
  confirmPassword: string,
): AuthErrors {
  const errors: AuthErrors = {};

  if (!isValidUsername(username)) {
    errors.username = "Använd 3–30 tecken: a–z, siffror och understreck.";
  }

  if (!password) {
    errors.password = "Ange ditt lösenord.";
  } else if (mode === "register" && password.length < 6) {
    errors.password = "Lösenordet måste innehålla minst 6 tecken.";
  }

  if (mode === "register" && password !== confirmPassword) {
    errors.confirmPassword = "Lösenorden stämmer inte överens.";
  }

  return errors;
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,30}$/.test(normalizeUsername(username));
}

export function usernameToEmail(username: string): string {
  if (!isValidUsername(username)) {
    throw new Error("Ogiltigt användarnamn.");
  }

  return `${normalizeUsername(username)}@users.example.com`;
}

const authMessages: Record<string, string> = {
  invalid_credentials: "Fel användarnamn eller lösenord.",
  email_not_confirmed: "Kontot kan inte användas ännu. Kontakta projektansvarig.",
  user_already_exists: "Användarnamnet är redan upptaget.",
  email_exists: "Användarnamnet är redan upptaget.",
  weak_password: "Lösenordet uppfyller inte kraven. Välj ett längre och starkare lösenord.",
  email_address_invalid: "Användarnamnet kunde inte användas. Försök med ett annat.",
  over_request_rate_limit: "För många försök. Vänta en stund och försök igen.",
  over_email_send_rate_limit: "För många försök. Vänta en stund och försök igen.",
  signup_disabled: "Registrering är inte tillgänglig just nu.",
};

export function authErrorMessage(code?: string): string {
  return (code && Object.hasOwn(authMessages, code) ? authMessages[code] : undefined)
    ?? "Det gick inte att genomföra begäran. Kontrollera anslutningen och försök igen.";
}
