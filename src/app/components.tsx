import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppModal, Avatar, Badge, Card, PillButton, TextField } from "../components/ui";
import { AvatarEmoji, avatars } from "../theme/avatars";
import { useTheme } from "../theme/ThemeProvider";

// Visar alla gemensamma komponenter på ett ställe, så att man kan se hur
// de ser ut i ljust och mörkt läge. Öppnas från Utseende-skärmen.
export default function ComponentGallery() {
  const { colors } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const heading = [styles.heading, { color: colors.textMuted }];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={heading}>KORT OCH BRICKOR</Text>
      <Card onPress={() => {}}>
        <Text style={[styles.cardText, { color: colors.text }]}>Damma</Text>
        <Badge label={7} />
      </Card>
      <Card>
        <Text style={[styles.cardText, { color: colors.text }]}>Torka golvet</Text>
        <Badge label={24} overdue />
      </Card>

      <Text style={heading}>KNAPPAR</Text>
      <View style={styles.row}>
        <PillButton label="⊕  Lägg till" />
        <PillButton label="Spara" variant="primary" />
        <PillButton label="Ta bort" variant="danger" />
        <PillButton label="Inaktiv" variant="primary" disabled />
      </View>

      <Text style={heading}>AVATARER</Text>
      <View style={styles.row}>
        {(Object.keys(avatars) as AvatarEmoji[]).map((emoji, i) => (
          <Avatar key={emoji} emoji={emoji} selected={i === 0} disabled={i === 2} />
        ))}
      </View>

      <Text style={heading}>TEXTFÄLT</Text>
      <TextField placeholder="Titel" />
      <TextField placeholder="Beskrivning" multiline />
      <TextField placeholder="Titel" error="Titel måste fyllas i" />

      <Text style={heading}>MODAL</Text>
      <PillButton label="Öppna modal" onPress={() => setModalOpen(true)} />
      <AppModal
        visible={modalOpen}
        title="Skapa en ny syssla"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <PillButton label="⊕  Spara" onPress={() => setModalOpen(false)} />
            <PillButton label="⊗  Stäng" onPress={() => setModalOpen(false)} />
          </>
        }
      >
        <TextField placeholder="Titel" />
        <TextField placeholder="Beskrivning" multiline />
      <TextField placeholder="Titel" error="Titel måste fyllas i" />
      </AppModal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
  },
  cardText: {
    fontSize: 17,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
