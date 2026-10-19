import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MemberSummary } from "../data/households";
import { useTheme } from "../theme/ThemeProvider";
import { Avatar, Card } from "./ui";

type Props = {
  members: MemberSummary[];
  /** Om den inloggade är ägare. Då visas ⋯ på alla utom en själv. */
  canManage: boolean;
  /** Anropas när ägaren trycker på ⋯ på en medlem. */
  onOpenMenu: (member: MemberSummary) => void;
};

const AVATAR_SIZE = 32;

// Listan "MEDLEMMAR" i hushållsvyn: avatar, namn och "Ägare" (#16).
// Förfrågningar (isApproved = false) visas inte här utan i en egen lista.
export function MemberList({ members, canManage, onOpenMenu }: Props) {
  const { colors } = useTheme();
  const approved = members.filter((member) => member.isApproved);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>MEDLEMMAR</Text>

      {approved.map((member) => (
        <Card key={member.userId}>
          <View style={styles.person}>
            {member.avatar ? (
              <Avatar emoji={member.avatar} size={AVATAR_SIZE} />
            ) : (
              // Ingen avatar vald än (väljs på profilsidan, #29).
              <View style={[styles.noAvatar, { backgroundColor: colors.border }]}>
                <Text style={{ color: colors.textMuted }}>?</Text>
              </View>
            )}
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {member.name || "Inget namn"}
            </Text>
          </View>
          <View style={styles.right}>
            {member.isOwner && (
              <Text style={[styles.role, { color: colors.textMuted }]}>Ägare</Text>
            )}
            {/* Inte på en själv, så att det alltid finns minst en ägare kvar. */}
            {canManage && !member.isMe && (
              <Pressable
                onPress={() => onOpenMenu(member)}
                hitSlop={12}
                accessibilityLabel={`Val för ${member.name || "medlemmen"}`}
              >
                <Text style={[styles.more, { color: colors.textMuted }]}>⋯</Text>
              </Pressable>
            )}
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  noAvatar: {
    // Samma yttre storlek som Avatar, som har en ring på 4 px runt cirkeln.
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  role: {
    fontSize: 13,
  },
  more: {
    fontSize: 20,
    paddingHorizontal: 4,
  },
});
