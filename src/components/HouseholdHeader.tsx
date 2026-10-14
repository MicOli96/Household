import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { Card } from "./ui";

type TitleProps = {
  name: string;
  /** Bara ägare får byta namn, därför visas pennan bara för dem. */
  isOwner: boolean;
};

// Hushållets namn i rubriken högst upp, med en penna för ägare (#15).
export function HouseholdTitle({ name, isOwner }: TitleProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.title}>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>
      {/* Gör inget än, öppnar dialogen "Byt namn" i nästa steg. */}
      {isOwner && (
        <Pressable hitSlop={8} accessibilityLabel="Byt namn">
          <Text style={[styles.pen, { color: colors.primary }]}>✎</Text>
        </Pressable>
      )}
    </View>
  );
}

type Props = {
  code: string;
};

// Kortet överst i hushållsvyn med koden för att gå med (#15).
export function HouseholdHeader({ code }: Props) {
  const { colors } = useTheme();

  // Öppnar telefonens dela-meny (sms, Messenger, kopiera m.m.) med bara koden,
  // så att mottagaren kan kopiera den rakt in i "Gå med i hushåll".
  async function shareCode() {
    try {
      await Share.share({ message: code });
    } catch {
      // Delning finns inte överallt (t.ex. vissa webbläsare), då händer inget.
    }
  }

  return (
    <Card>
      <View style={styles.info}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Kod för att gå med</Text>
        <Text style={[styles.code, { color: colors.text }]}>{code}</Text>
      </View>
      <Pressable onPress={shareCode} hitSlop={8}>
        <Text style={[styles.action, { color: colors.primary }]}>Dela</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    flexShrink: 1,
  },
  pen: {
    fontSize: 20,
  },
  info: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  code: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 2,
  },
  action: {
    fontSize: 15,
    fontWeight: "500",
  },
});
