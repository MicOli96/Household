import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MemberSummary } from "../data/households";
import { useTheme } from "../theme/ThemeProvider";
import { PillButton } from "./ui";

type Props = {
  /** Medlemmen som menyn gäller, eller null när menyn är stängd. */
  member: MemberSummary | null;
  onClose: () => void;
  /** Gör medlemmen till ägare, eller tar bort ägarrollen om medlemmen redan är ägare. */
  onToggleOwner: (member: MemberSummary) => void;
  onPause: (member: MemberSummary) => void;
};

// Menyn som glider upp nerifrån när en ägare trycker på ⋯ på en medlem,
// som "7b Medlem – meny" i Figma. Vad knapparna gör bestämmer skärmen.
export function MemberMenu({ member, onClose, onToggleOwner, onPause }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={member !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Tryck inne i menyn ska inte stänga den, därför en egen Pressable här */}
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 },
          ]}
        >
          {member && (
            <>
              <Text style={[styles.title, { color: colors.text }]}>
                {member.name || "Inget namn"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Endast ägare ser de här valen
              </Text>

              <View style={styles.buttons}>
                <PillButton
                  label={member.isOwner ? "Ta bort som ägare" : "Gör till ägare"}
                  onPress={() => onToggleOwner(member)}
                />
                <PillButton label="Pausa medlem" onPress={() => onPause(member)} />
              </View>

              <Pressable onPress={onClose} hitSlop={8} style={styles.cancel}>
                <Text style={[styles.cancelText, { color: colors.textMuted }]}>Avbryt</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
  },
  buttons: {
    gap: 12,
    marginTop: 16,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: 16,
  },
  cancelText: {
    fontSize: 16,
  },
});
