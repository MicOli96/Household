import { QueryClientProvider } from "@tanstack/react-query";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { BrandSplash } from "../components/BrandSplash";
import { AuthSessionProvider, useAuthSession } from "../data/AuthSession";
import { HouseholdDataProvider } from "../data/HouseholdData";
import { queryClient } from "../lib/queryClient";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";

// Den inbyggda splashen ligger kvar tills vi vet om någon är inloggad,
// annars syns inloggningen en kort stund innan dagsvyn.
SplashScreen.preventAutoHideAsync();

function ThemedStack() {
  const { scheme, colors } = useTheme();
  const { session, loading } = useAuthSession();

  useEffect(() => {
    if (!loading) SplashScreen.hide();
  }, [loading]);

  // Skärmarna visas först när sessionen är inläst, så att en länk direkt till
  // en skärm inte skickas till inloggningen medan den läses in.
  if (loading) return null;

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Skärmarna för den som är inloggad (#75). Loggar man ut skickas man
            till inloggningen, och loggar man in hamnar man i dagsvyn, som i
            sin tur skickar vidare till Mina hushåll om inget hushåll är öppnat. */}
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="index" options={{ title: "Sysslor" }} />
          <Stack.Screen name="settings" options={{ title: "Inställningar" }} />
          <Stack.Screen name="chore/[id]" options={{ title: "" }} />

          {/* Område 2: Konto & Profil */}
          <Stack.Screen name="profile" options={{ title: "Profil", headerShown: false }} />
          <Stack.Screen name="households/join" options={{ title: "Gå med i hushåll" }} />
          <Stack.Screen name="households/pending" options={{ title: "Väntar på godkännande" }} />

          {/* Område 3: Hushåll */}
          <Stack.Screen name="households/index" options={{ title: "Mina hushåll" }} />
          <Stack.Screen name="household" options={{ title: "Hushåll" }} />

          {/* Område 4: Sysslor */}
          <Stack.Screen
            name="chore/new"
            options={{ title: "Skapa en ny syssla", presentation: "modal" }}
          />
          <Stack.Screen name="chore/[id]/edit" options={{ title: "Redigera syssla" }} />

          {/* Område 5: Schemaläggning */}
          <Stack.Screen
            name="chore/[id]/assign"
            options={{ title: "Tilldela", presentation: "modal" }}
          />
          <Stack.Screen name="groups" options={{ title: "Rotationsgrupper" }} />

          {/* Område 6: Statistik */}
          <Stack.Screen name="statistics" options={{ title: "Statistik" }} />
        </Stack.Protected>

        {/* Inloggningen går bara att öppna när ingen är inloggad. */}
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)/login" options={{ title: "Logga in" }} />
          <Stack.Screen name="(auth)/register" options={{ title: "Skapa konto" }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthSessionProvider>
          <HouseholdDataProvider>
            <ThemedStack />
          </HouseholdDataProvider>
        </AuthSessionProvider>
        <BrandSplash />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
