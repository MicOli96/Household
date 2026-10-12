import { Link } from "expo-router";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { ChoreCard } from "../components/ChoreCard";
import { mockChores } from "../data/mockChores";
import { useTheme } from "../theme/ThemeProvider";

// Dagsvyn: listar hushållets sysslor och visar vad som behöver göras.
// Krav: "Alla sysslor ska listas i en dagsvy och ge en översikt kring vad
// som behöver göras."
export default function DailyView() {
  const { colors } = useTheme();

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
        <Pressable style={[styles.pill, { backgroundColor: colors.card }]}>
          <Text style={[styles.pillText, { color: colors.text }]}>
            ⊕ Lägg till
          </Text>
        </Pressable>

        {/* Tillfällig länk till temainställningarna. */}
        <Link href="/settings" asChild>
          <Pressable style={[styles.pill, { backgroundColor: colors.card }]}>
            <Text style={[styles.pillText, { color: colors.text }]}>
              ✎ Ändra
            </Text>
          </Pressable>
        </Link>
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
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pillText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
