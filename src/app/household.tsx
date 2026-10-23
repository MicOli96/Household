import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { HouseholdHeader, HouseholdTitle } from "../components/HouseholdHeader";
import { MemberList } from "../components/MemberList";
import { MemberMenu } from "../components/MemberMenu";
import { Placeholder } from "../components/Placeholder";
import { RenameHouseholdDialog } from "../components/RenameHouseholdDialog";
import { RequestList } from "../components/RequestList";
import { PillButton } from "../components/ui";
import { useHouseholdData } from "../data/HouseholdData";
import {
  getHousehold,
  getMembers,
  householdError,
  MemberSummary,
  renameHousehold,
  setMemberOwner,
} from "../data/households";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import { useTheme } from "../theme/ThemeProvider";

// TODO (område 3): Resten av hushållsvyn, se #16–#21 och #26.
// Byt ut Placeholder mot den riktiga vyn.
// Byt namn och medlemsmenyn (gör till ägare, pausa) är modaler (AppModal), inte egna skärmar.
export default function Household() {
  const { colors } = useTheme();
  const { openHousehold } = useHouseholdData();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const householdId = Array.isArray(id) ? id[0] : id;

  // Id:t ingår i nycklarna, så att varje hushåll får en egen låda i cachen.
  const householdQuery = useQuery({
    queryKey: ["household", householdId],
    queryFn: () => getHousehold(householdId as string),
    enabled: !!householdId,
  });
  const membersQuery = useQuery({
    queryKey: ["members", householdId],
    queryFn: () => getMembers(householdId as string),
    enabled: !!householdId,
  });
  const household = householdQuery.data ?? null;
  const members = membersQuery.data ?? [];
  const queryError = householdQuery.error ?? membersQuery.error;
  const error = queryError ? householdError(queryError) : "";

  const { refetch: refetchHousehold } = householdQuery;
  const { refetch: refetchMembers } = membersQuery;
  const refetchAll = useCallback(() => {
    refetchHousehold();
    refetchMembers();
  }, [refetchHousehold, refetchMembers]);
  useRefreshOnFocus(refetchAll);

  // Den inloggade är ägare om dess egen rad bland medlemmarna har isOwner.
  const isOwner = members.some((m) => m.isMe && m.isOwner);

  // Förfrågningar: de som har skickat en förfrågan men inte är godkända än (#17).
  const requests = members.filter((m) => !m.isApproved);

  // Den som inte är godkänd än kommer inte in i hushållet, utan ser sin förfrågan (#25).
  const isPending = members.some((m) => m.isMe && !m.isApproved);
  useEffect(() => {
    if (isPending && householdId) {
      router.replace({
        pathname: "/households/pending",
        params: { id: householdId },
      });
    }
  }, [isPending, householdId]);

  // Om dialogen "Byt namn på hushållet" är öppen.
  const [renaming, setRenaming] = useState(false);

  // Både det här hushållet och listan i Mina hushåll visar namnet.
  const renameMutation = useMutation({
    mutationFn: (name: string) => renameHousehold(householdId as string, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household", householdId] });
      queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });

  // Dialogen väntar på svaret och visar felet om det misslyckas.
  async function rename(name: string) {
    await renameMutation.mutateAsync(name);
    setRenaming(false);
  }

  // Medlemmen vars meny (⋯) är öppen, eller null när menyn är stängd.
  const [menuMember, setMenuMember] = useState<MemberSummary | null>(null);
  const closeMenu = () => setMenuMember(null);
  // Fel från valen i menyn, visas under medlemslistan.
  const [memberError, setMemberError] = useState("");

  // Gör medlemmen till ägare, eller tar bort ägarrollen om man råkat ge den (#19).
  const ownerMutation = useMutation({
    mutationFn: (member: MemberSummary) =>
      setMemberOwner(householdId as string, member.userId, !member.isOwner),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", householdId] }),
    onError: (reason) => setMemberError(householdError(reason)),
  });

  function toggleOwner(member: MemberSummary) {
    closeMenu();
    setMemberError("");
    ownerMutation.mutate(member);
  }

  // TODO (#20): Pausa medlem. Lägg till en rad i pauses (user_id, household_id,
  // start_date) och visa "Pausad" i listan. Pausade räknas inte med i statistiken.
  function pauseMember(member: MemberSummary) {
    closeMenu();
  }

  if (!household) {
    return (
      <View style={styles.message}>
        <Text style={{ color: error ? colors.danger : colors.textMuted }}>
          {error ||
            (householdId ? "Hämtar hushållet..." : "Inget hushåll är valt.")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Rubriken högst upp visar hushållets namn i stället för "Hushåll", som i Figma. */}
      <Stack.Screen
        options={{
          headerTitle: () => (
            <HouseholdTitle
              name={household.name}
              isOwner={isOwner}
              onEdit={() => setRenaming(true)}
            />
          ),
          headerTitleAlign: "center",
        }}
      />

      <View style={styles.header}>
        <HouseholdHeader code={household.code} />
        <MemberList
          members={members}
          canManage={isOwner}
          onOpenMenu={setMenuMember}
        />
        {memberError ? (
          <Text accessibilityRole="alert" style={{ color: colors.danger }}>
            {memberError}
          </Text>
        ) : null}

        {/* Bara ägare ser förfrågningarna (#17). */}
        {isOwner && <RequestList requests={requests} />}

        {/* Väljer hushållet för dagsvyn och går dit (#12). */}
        <PillButton
          label="Visa sysslor"
          variant="primary"
          onPress={() => {
            openHousehold(household.id);
            router.dismissTo("/");
          }}
        />
      </View>

      {renaming && (
        <RenameHouseholdDialog
          currentName={household.name}
          onClose={() => setRenaming(false)}
          onSave={rename}
        />
      )}

      <MemberMenu
        member={menuMember}
        onClose={closeMenu}
        onToggleOwner={toggleOwner}
        onPause={pauseMember}
      />

      <Placeholder
        title="Kvar att bygga"
        area={3}
        issues="#18–#20, #26"
        todo={[
          "⋯ på en medlem öppnar menyn: gör till ägare, pausa (#19, #20, ägare)",
          'Pausade medlemmar markeras "Pausad" (#20)',
          "Förfrågningar: acceptera eller neka (#18, ägare)",
          "Lämna hushåll (#26)",
        ]}
        tables={[
          "households (name)",
          "household_members (is_owner, is_approved, deleted_at)",
          "pauses",
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 0,
    gap: 24,
  },
  message: {
    padding: 24,
  },
});
