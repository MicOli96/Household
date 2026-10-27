import { useQuery } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { Pressable, StyleSheet } from "react-native";
import { Icon } from "../../components/ui";
import { useHouseholdData } from "../../data/HouseholdData";
import { getHousehold } from "../../data/households";
import { useTheme } from "../../theme/ThemeProvider";

// Flikarna längst ner (#104): Hushåll, Sysslor och Statistik. Alla tre har
// samma rubrikrad med hushållets namn, kugghjulet till vänster och profilen
// till höger. Skärmar som öppnas från en flik ligger i den yttre stacken och
// har kvar sin tillbaka-pil.

// Sysslor är förvald, och tillbaka från en annan flik går dit.
export const unstable_settings = {
  initialRouteName: "index",
};

export default function TabsLayout() {
  const { colors } = useTheme();
  const { householdId } = useHouseholdData();

  // Samma nyckel som i fliken Hushåll, så att namnet bara hämtas en gång.
  const householdQuery = useQuery({
    queryKey: ["household", householdId],
    queryFn: () => getHousehold(householdId as string),
    enabled: !!householdId,
  });

  // Utan öppnat hushåll visas Mina hushåll, utan flikar (#75).
  if (!householdId) return <Redirect href="/households" />;

  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={{
        headerTitle: householdQuery.data?.name ?? "",
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerLeft: () => (
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Inställningar"
            style={styles.headerButton}
          >
            <Icon name="settings" color={colors.text} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/profile")}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Din profil"
            style={styles.headerButton}
          >
            <Icon name="profile" color={colors.text} />
          </Pressable>
        ),
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="household"
        options={{
          title: "Hushåll",
          tabBarIcon: ({ color }) => <Icon name="household" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Sysslor",
          tabBarIcon: ({ color }) => <Icon name="chores" color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Statistik",
          tabBarIcon: ({ color }) => <Icon name="statistics" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    paddingHorizontal: 16,
  },
});
