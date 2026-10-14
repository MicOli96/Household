import { Href, router } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";
import { PillButton } from "../components/ui";
import { useTheme } from "../theme/ThemeProvider";

// Lista med alla skärmar, så att man kan hoppa direkt till sin egen
// medan appen byggs. Tas bort innan inlämningen.
const sections: { title: string; screens: { label: string; href: Href }[] }[] = [
  {
    title: "Område 2: Konto & Profil",
    screens: [
      { label: "Logga in", href: "/login" },
      { label: "Skapa konto", href: "/register" },
      { label: "Profil", href: "/profile" },
      { label: "Gå med i hushåll", href: "/households/join" },
      { label: "Väntar på godkännande", href: "/households/pending" },
    ],
  },
  {
    title: "Område 3: Hushåll",
    screens: [
      { label: "Mina hushåll", href: "/households" },
      { label: "Hushåll", href: "/household" },
    ],
  },
  {
    title: "Område 4: Sysslor",
    screens: [
      { label: "Skapa en ny syssla", href: "/chore/new" },
      { label: "Redigera syssla", href: "/chore/1/edit" },
    ],
  },
  {
    title: "Område 5: Dagsvy & Schemaläggning",
    screens: [
      { label: "Dagsvy", href: "/" },
      { label: "Detaljvy", href: "/chore/1" },
      { label: "Tilldela (modal)", href: "/chore/1/assign" },
      { label: "Rotationsgrupper", href: "/groups" },
      { label: "Inställningar", href: "/settings" },
    ],
  },
  {
    title: "Område 6: Statistik",
    screens: [{ label: "Statistik", href: "/statistics" }],
  },
];

export default function Screens() {
  const { colors } = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {sections.map((section) => [
        <Text key={section.title} style={[styles.heading, { color: colors.textMuted }]}>
          {section.title.toUpperCase()}
        </Text>,
        ...section.screens.map((screen) => (
          <PillButton
            key={screen.label}
            label={screen.label}
            onPress={() => router.push(screen.href)}
          />
        )),
      ])}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 10,
  },
  heading: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
  },
});
