import { useState } from "react";
import { Text } from "react-native";
import { useAuthSession } from "../data/AuthSession";
import { useHouseholdData } from "../data/HouseholdData";
import { useTheme } from "../theme/ThemeProvider";
import { PillButton } from "./ui";

// Knappen "Logga ut" i Inställningar (#75, #107).
// Efter utloggningen skickar _layout.tsx vidare till inloggningen.
export function SignOutButton() {
  const { colors } = useTheme();
  const { openHousehold } = useHouseholdData();
  const { signOut } = useAuthSession();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setSigningOut(true);
    setError("");
    try {
      await signOut();
      // Den som loggar in efteråt ska inte hamna i samma hushåll.
      openHousehold(null);
    } catch {
      setError("Kunde inte logga ut. Försök igen.");
      setSigningOut(false);
    }
  }

  return (
    <>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>
      ) : null}
      <PillButton
        label={signingOut ? "Loggar ut..." : "Logga ut"}
        onPress={handleSignOut}
        disabled={signingOut}
      />
    </>
  );
}
