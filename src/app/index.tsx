import { router } from "expo-router";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { ChoreCard } from "../components/ChoreCard";
import { PillButton } from "../components/ui";
import { mockChores } from "../data/mockChores";

// Dagsvyn: listar hushållets sysslor och visar vad som behöver göras.
// Krav: "Alla sysslor ska listas i en dagsvy och ge en översikt kring vad
// som behöver göras."
export default function DailyView() {
  return (
    <View style={styles.container}>
      {/* TODO (Sebastian, steg 4 i guiden): raden "‹ idag ›" från skissen.
          Pilarna ska byta mellan idag och statistikvyerna senare, så de
          behöver inte göra något än. */}

      <FlatList
        data={mockChores}
        keyExtractor={(chore) => chore.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ChoreCard
            chore={item}
            // TODO (Sebastian, steg 5 i guiden): öppna en detaljvy för
            // sysslan i stället för en Alert.
            onPress={() => Alert.alert(item.name, item.description)}
          />
        )}
      />

      <View style={styles.footer}>
        {/* TODO (Sebastian, steg 6 i guiden): "Lägg till" ska öppna
            formuläret "Skapa en ny syssla" från skissen. */}
        <PillButton label="⊕  Lägg till" />

        {/* Tillfällig länk till temainställningarna. */}
        <PillButton label="✎  Ändra" onPress={() => router.push("/settings")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 32,
  },
});
