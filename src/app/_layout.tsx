import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BrandSplash } from "../components/BrandSplash";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";

function ThemedStack() {
  const { scheme, colors } = useTheme();

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
        <Stack.Screen name="index" options={{ title: "Sysslor" }} />
        <Stack.Screen name="settings" options={{ title: "Inställningar" }} />
        <Stack.Screen name="components" options={{ title: "Komponenter" }} />
        <Stack.Screen name="chore/[id]" options={{ title: "" }} />

        {/* Område 2: Konto & Profil */}
        <Stack.Screen name="(auth)/login" options={{ title: "Logga in" }} />
        <Stack.Screen name="(auth)/register" options={{ title: "Skapa konto" }} />
        <Stack.Screen name="profile" options={{ title: "Profil" }} />
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

        {/* Översikt över alla skärmar, bara under utvecklingen */}
        <Stack.Screen name="screens" options={{ title: "Alla skärmar" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStack />
      <BrandSplash />
    </ThemeProvider>
  );
}