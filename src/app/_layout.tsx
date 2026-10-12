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
        <Stack.Screen name="settings" options={{ title: "Utseende" }} />
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