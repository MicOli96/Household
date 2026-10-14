export type AuthMode = "login" | "register";

export type AuthErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function validateAuth(
  mode: AuthMode,
  email: string,
  password: string,
  confirmPassword: string,
): AuthErrors {
  const errors: AuthErrors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = "Ange en giltig e-postadress.";
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

export function authErrorMessage(code?: string): string {
  switch (code) {
    case "invalid_credentials":
      return "Fel e-postadress eller lösenord.";

    case "email_not_confirmed":
      return "Bekräfta din e-postadress innan du loggar in.";

    case "user_already_exists":
    case "email_exists":
      return "Det finns redan ett konto med den e-postadressen.";

    case "weak_password":
      return "Lösenordet uppfyller inte kraven. Välj ett längre och starkare lösenord.";

    case "email_address_invalid":
      return "Ange en giltig e-postadress.";

    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "För många försök. Vänta en stund och försök igen.";

    case "signup_disabled":
      return "Registrering är inte tillgänglig just nu.";

    default:
      return "Det gick inte att genomföra begäran. Kontrollera anslutningen och försök igen.";
  }
}
