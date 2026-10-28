import { router } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { ChoreCard } from "../../components/ChoreCard";
import { PillButton } from "../../components/ui";
import { useHouseholdData } from "../../data/HouseholdData";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import { useTheme } from "../../theme/ThemeProvider";

// Dagsvyn: listar hushållets sysslor och visar vad som behöver göras.
// Krav: "Alla sysslor ska listas i en dagsvy och ge en översikt kring vad
// som behöver göras."
export default function DailyView() {
  const { colors } = useTheme();
  const { chores, currentMember, loading, error, reload } = useHouseholdData();
  // Hämtar om när man kommer tillbaka till fliken, så att det andra har gjort syns.
  useRefreshOnFocus(reload);

  return (
    <View style={styles.container}>
      {loading && <Text style={[styles.notice, { color: colors.textMuted }]}>Hämtar sysslor...</Text>}
      {error ? (
        <View style={styles.notice}>
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text>
          <PillButton label="Försök igen" onPress={reload} />
        </View>
      ) : null}
      {!loading && !error && chores.length === 0 && (
        <Text style={[styles.notice, { color: colors.textMuted }]}>
          Hushållet har inga sysslor ännu.
        </Text>
      )}

      <FlatList
        data={chores}
        keyExtractor={(chore) => chore.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ChoreCard
            chore={item}
            onPress={() => router.push(`/chore/${item.id}`)}
          />
        )}
      />

      {/* Vänta tills hushållet är hämtat, så att knappen bara syns för ägare. */}
      {!loading && currentMember?.isOwner && (
        <View style={styles.footer}>
          <PillButton
            label="+  Lägg till syssla"
            variant="primary"
            onPress={() => router.push("/chore/new")}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notice: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  footer: {
    padding: 16,
  },
});
