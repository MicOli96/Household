import { Href, router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { Card, PillButton } from "./ui";

type Props = {
  /** Skärmens namn, t.ex. "Statistik". */
  title: string;
  /** Vilket område som äger skärmen, t.ex. 6. */
  area: number;
  /** Issues som skärmen ska lösa, t.ex. "#39–#44". */
  issues: string;
  /** Kort beskrivning av vad som ska byggas. */
  todo: string[];
  /** Knappar till nästa skärmar i flödet (som i Figma-prototypen). */
  links?: { label: string; href: Href }[];
};

// Tillfällig skärm som visar vad som ska byggas och var.
// Byt ut hela innehållet i skärmfilen mot den riktiga vyn när ni bygger den.
export function Placeholder({ title, area, issues, todo, links = [] }: Props) {
  const { colors } = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        Område {area} · {issues}
      </Text>

      <Card>
        <View style={styles.todo}>
          <Text style={[styles.label, { color: colors.textMuted }]}>ATT BYGGA</Text>
          {todo.map((line) => (
            <Text key={line} style={[styles.line, { color: colors.text }]}>
              • {line}
            </Text>
          ))}
        </View>
      </Card>

      {links.map((link) => (
        <PillButton
          key={link.label}
          label={link.label}
          onPress={() => router.push(link.href)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  meta: {
    fontSize: 13,
    marginTop: -12,
  },
  todo: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  line: {
    fontSize: 15,
  },
});
