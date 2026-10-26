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
  onConfirm: () => void;
  onCancel: () => void;
  /** Ett mildare val, t.ex. "Arkivera i stället" när man tar bort en syssla. */
  alternative?: { label: string; onPress: () => void };
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
}: Props) {
  const { colors } = useTheme();

  return (
    <AppModal
      visible={visible}
      title={title}
      onClose={() => {
        if (!busy) onCancel();
      }} >
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : null}

      <View style={styles.buttons}>
        {alternative && (
          <PillButton label={alternative.label} variant="primary" onPress={alternative.onPress} disabled={busy} />
        )}
        <PillButton label={confirmLabel} variant="danger" onPress={onConfirm} disabled={busy} />
        <PillButton label="Avbryt" onPress={onCancel} disabled={busy} />
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
