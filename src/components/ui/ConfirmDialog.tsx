import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppModal } from "./AppModal";
import { PillButton } from "./PillButton";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  /** Texten på knappen som gör det farliga, t.ex. "Ta bort ändå". */
  confirmLabel: string;
  onConfirm?: () => void;
  onCancel: () => void;
  /** Ett mildare val, t.ex. "Arkivera i stället" när man tar bort en syssla. */
  alternative?: { label: string; onPress: () => void };
  isSubmitting?: boolean;
};

// Varningsrutan innan något tas bort eller nekas, som "Ta bort syssla" i Figma.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  alternative,
  isSubmitting = false,
}: Props) {
  const { colors } = useTheme();

  return (
    <AppModal visible={visible} title={title} onClose={() => { if (!isSubmitting) onCancel(); }}>
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
      <View style={styles.buttons}>
        {alternative && (
          <PillButton label={alternative.label} variant="primary" onPress={alternative.onPress} disabled={isSubmitting} />
        )}
        <PillButton label={confirmLabel} variant="danger" onPress={onConfirm} disabled={!onConfirm || isSubmitting} />
        <PillButton label="Avbryt" onPress={onCancel} disabled={isSubmitting} />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: 15,
  },
  buttons: {
    gap: 8,
  },
});
