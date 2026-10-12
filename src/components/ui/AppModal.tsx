import { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Knapparna längst ner, t.ex. "Spara" och "Stäng". */
  footer?: ReactNode;
};

// Den vita rutan som läggs ovanpå skärmen, som "Skapa en ny syssla" i
// skisserna och dialogen "Ta bort syssla". Trycker man utanför stängs den.
export function AppModal({ visible, title, onClose, children, footer }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Tryck inne i rutan ska inte stänga den, därför en egen Pressable här */}
        <Pressable style={[styles.sheet, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <View style={styles.content}>{children}</View>
          {footer && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>{footer}</View>
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
    justifyContent: "center",
    padding: 16,
  },
  sheet: {
    borderRadius: 16,
    overflow: "hidden",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    padding: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    padding: 12,
  },
});
