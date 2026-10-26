import { useRef, useState } from "react";
import { login, register } from "../data/auth";
import { authErrorMessage, validateAuth } from "../utils/auth";
import type { AuthErrors, AuthMode } from "../utils/auth";

export function useAuthForm(mode: AuthMode) {
  const registering = mode === "register";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) {
      return;
    }

    const nextErrors = validateAuth(mode, username, password, confirmationPassword);

    setErrors(nextErrors);
    setMessage("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      const { data, error } = registering
        ? await register(username, password)
        : await login(username, password);

      if (error) {
        setMessage(authErrorMessage(error.code));
        return;
      }

      if (data.session) {
        return;
      }

      if (registering) {
        setMessage("Kontot kunde inte loggas in direkt. Kontakta projektansvarig innan du försöker igen.");
        return;
      }

      setMessage(authErrorMessage());
    } catch {
      setMessage(authErrorMessage());
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return {
    username,
    setUsername,
    password,
    setPassword,
    confirmationPassword,
    setConfirmationPassword,
    errors,
    message,
    loading,
    submit,
  };
}
