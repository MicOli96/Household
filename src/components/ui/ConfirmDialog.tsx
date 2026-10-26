import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { AppModal } from "./AppModal";
import { PillButton } from "./PillButton";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  error?: string;
  busy?: boolean;
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
  error,
  busy = false,
  confirmLabel,
  onConfirm,
  onCancel,
  alternative,
  isSubmitting = false,
}: Props) {
  const { colors } = useTheme();

  // Behåll stöd för både #35:s och #37:s laddningsprop.
  const pending = busy || isSubmitting;
  function cancel() {
    if (!pending) onCancel();
  }

  return (
    <AppModal visible={visible} title={title} onClose={cancel}>
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>
      ) : null}
      <View style={styles.buttons}>
        {alternative && (
          <PillButton label={alternative.label} variant="primary"
            onPress={alternative.onPress} disabled={pending} />
        )}
        <PillButton label={confirmLabel} variant="danger" onPress={onConfirm}
          disabled={!onConfirm || pending} />
        <PillButton label="Avbryt" onPress={cancel} disabled={pending} />
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
