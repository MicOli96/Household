import { StyleSheet, Text, View } from "react-native";
import type { Member } from "../data/types";
import { useTheme } from "../theme/ThemeProvider";
import { Avatar } from "./ui";

type Props = { members: Member[]; size?: number };

/** Samma avatarvisning i dagsvy, detaljvy och statistik (#32). */
export function CompletedBy({ members, size = 24 }: Props) {
  const { colors } = useTheme();
  if (members.length === 0) return null;
  return (
    <View style={styles.row}>
      {members.map((member) => (
        <View key={member.userId} accessible accessibilityRole="image"
          accessibilityLabel={`Utförd av ${member.name || "medlem utan namn"}${member.avatar ? "" : ", ingen avatar vald"}`}>
          {member.avatar ? <Avatar emoji={member.avatar} size={size} /> : (
            <View style={[styles.fallback, {
              width: size + 8, height: size + 8, borderRadius: (size + 8) / 2,
              backgroundColor: colors.border,
            }]}>
              <Text style={{ color: colors.text, fontSize: size * 0.55 }}>
                {member.name.trim().slice(0, 1).toLocaleUpperCase() || "?"}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 4, flexShrink: 1, alignItems: "center" },
  fallback: { alignItems: "center", justifyContent: "center" },
});
