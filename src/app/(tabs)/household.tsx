import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { HouseholdHeader, HouseholdTitle } from "../../components/HouseholdHeader";
import { MemberList } from "../../components/MemberList";
import { MemberMenu } from "../../components/MemberMenu";
import { PauseDialog } from "../../components/PauseDialog";
import { RenameHouseholdDialog } from "../../components/RenameHouseholdDialog";
import { RequestList } from "../../components/RequestList";
import { ConfirmDialog, PillButton } from "../../components/ui";
import { useHouseholdData } from "../../data/HouseholdData";
import {
  approveRequest,
  denyRequest,
  getHousehold,
  getMembers,
  householdError,
  leaveHousehold,
  MemberSummary,
  renameHousehold,
  setMemberOwner,
} from "../../data/households";
import {
  addPause,
  getPauses,
  isPausedToday,
  pauseError,
  PauseSummary,
  stopPause,
} from "../../data/pauses";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import { useTheme } from "../../theme/ThemeProvider";

// Fliken Hushåll (#104): det öppnade hushållets namn, kod och medlemmar.
// Byt namn och medlemsmenyn (gör till ägare, pausa) är modaler (AppModal), inte egna skärmar.
export default function Household() {
  const { colors } = useTheme();
  const { householdId, openHousehold } = useHouseholdData();
  const queryClient = useQueryClient();

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
  const pausesQuery = useQuery({
    queryKey: ["pauses", householdId],
    queryFn: () => getPauses(householdId as string),
    enabled: !!householdId,
  });
  const household = householdQuery.data ?? null;
  const members = membersQuery.data ?? [];
  const pauses = pausesQuery.data ?? [];
  const queryError = householdQuery.error ?? membersQuery.error;
  const error = queryError ? householdError(queryError) : "";

  // Planerade pauser som inte har börjat räknas inte här.
  const pausedUserIds = pauses.filter(isPausedToday).map((pause) => pause.userId);

  const { refetch: refetchHousehold } = householdQuery;
  const { refetch: refetchMembers } = membersQuery;
  const { refetch: refetchPauses } = pausesQuery;
  const refetchAll = useCallback(() => {
    refetchHousehold();
    refetchMembers();
    refetchPauses();
  }, [refetchHousehold, refetchMembers, refetchPauses]);
  useRefreshOnFocus(refetchAll);

  // Den inloggade är ägare om dess egen rad bland medlemmarna har isOwner.
  const isOwner = members.some((m) => m.isMe && m.isOwner);
  const isApprovedMember = members.some((m) => m.isMe && m.isApproved);

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
  // Utan pauserna kan "Pausad" saknas i listan, så felet visas på samma ställe.
  const memberMessage =
    memberError || (pausesQuery.error ? pauseError(pausesQuery.error) : "");

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

  // Fel från Godkänn och Neka, visas under förfrågningarna.
  const [requestError, setRequestError] = useState("");

  // Godkänner eller nekar en förfrågan (#18). Medlemslistan hämtas om efteråt,
  // även vid fel (t.ex. om en annan ägare redan har svarat), så att förfrågan
  // försvinner och en godkänd person syns bland medlemmarna.
  const answerMutation = useMutation({
    mutationFn: ({ request, approve }: { request: MemberSummary; approve: boolean }) =>
      approve
        ? approveRequest(householdId as string, request.userId)
        : denyRequest(householdId as string, request.userId),
    onError: (reason) => setRequestError(householdError(reason)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["members", householdId] }),
  });

  function answerRequest(request: MemberSummary, approve: boolean) {
    setRequestError("");
    answerMutation.mutate({ request, approve });
  }

  // Medlemmen som dialogen "Pausa medlem" gäller, eller null när den är stängd (#20).
  const [pausingMember, setPausingMember] = useState<MemberSummary | null>(null);

  function pauseMember(member: MemberSummary) {
    closeMenu();
    setPausingMember(member);
  }

  const addPauseMutation = useMutation({
    mutationFn: (pause: { userId: string; startDate: string; endDate: string | null }) =>
      addPause(householdId as string, pause.userId, pause.startDate, pause.endDate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pauses", householdId] }),
  });

  const stopPauseMutation = useMutation({
    mutationFn: stopPause,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pauses", householdId] }),
  });

  // Dialogen väntar på svaret och visar felet om det misslyckas. Den stängs
  // efter varje val, så att ingen trycker Spara paus för att komma ut.
  async function savePause(member: MemberSummary, startDate: string, endDate: string | null) {
    await addPauseMutation.mutateAsync({ userId: member.userId, startDate, endDate });
    setPausingMember(null);
  }

  async function endPause(pause: PauseSummary) {
    await stopPauseMutation.mutateAsync(pause);
    setPausingMember(null);
  }

  const [leaving, setLeaving] = useState(false);
  const leaveMutation = useMutation({
    mutationFn: () => leaveHousehold(householdId as string),
    onSuccess: () => {
      setLeaving(false);
      openHousehold(null);
      queryClient.invalidateQueries({ queryKey: ["households"] });
      queryClient.removeQueries({ queryKey: ["household", householdId] });
      queryClient.removeQueries({ queryKey: ["members", householdId] });
      queryClient.removeQueries({ queryKey: ["pauses", householdId] });
      queryClient.removeQueries({ queryKey: ["chores", householdId] });
      router.dismissTo("/households");
    },
  });

  // Går hushållet inte att hämta (t.ex. om det är borttaget) ska man ändå
  // kunna byta till ett annat härifrån.
  if (!household) {
    return (
      <View style={styles.message}>
        <Text
          accessibilityRole={error ? "alert" : undefined}
          style={{ color: error ? colors.danger : colors.textMuted }}
        >
          {error || "Hämtar hushållet..."}
        </Text>
        {error ? (
          <PillButton label="Byt hushåll" onPress={() => router.push("/households")} />
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Ägare får en penna bredvid namnet i rubriken, som i Figma. Kugghjulet
          och profilen kommer från flikarnas layout. */}
      <Tabs.Screen
        options={{
          headerTitle: () => (
            <HouseholdTitle
              name={household.name}
              isOwner={isOwner}
              onEdit={() => setRenaming(true)}
            />
          ),
        }}
      />

      <HouseholdHeader code={household.code} />
      <MemberList
        members={members}
        pausedUserIds={pausedUserIds}
        canManage={isOwner}
        onOpenMenu={setMenuMember}
      />
      {memberMessage ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>
          {memberMessage}
        </Text>
      ) : null}

      {/* Bara ägare ser och svarar på förfrågningarna (#17, #18). */}
      {isOwner && (
        <RequestList
          requests={requests}
          onApprove={(request) => answerRequest(request, true)}
          onDeny={(request) => answerRequest(request, false)}
          disabled={answerMutation.isPending}
        />
      )}
      {requestError ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>
          {requestError}
        </Text>
      ) : null}

      {isOwner && (
        <View style={styles.rotationSection}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            ROTATIONSGRUPPER
          </Text>
          <PillButton label="Hantera rotationsgrupper" onPress={() => router.push("/groups")} />
        </View>
      )}

      <PillButton label="Byt hushåll" onPress={() => router.push("/households")} />
      {isApprovedMember ? (
        <>
          <PillButton
            label="Lämna hushåll"
            variant="danger"
            onPress={() => {
              leaveMutation.reset();
              setLeaving(true);
            }}
          />

          <ConfirmDialog
            visible={leaving}
            title="Lämna hushåll?"
            message={`Vill du lämna ”${household.name}”? Du kan gå med igen med koden, men då måste en ägare godkänna dig.`}
            error={leaveMutation.error ? householdError(leaveMutation.error) : undefined}
            busy={leaveMutation.isPending}
            confirmLabel="Lämna"
            onConfirm={() => leaveMutation.mutate()}
            onCancel={() => setLeaving(false)}
          />
        </>
      ) : null}

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

      {pausingMember && (
        <PauseDialog
          name={pausingMember.name}
          pauses={pauses.filter((pause) => pause.userId === pausingMember.userId)}
          onClose={() => setPausingMember(null)}
          onAdd={(startDate, endDate) => savePause(pausingMember, startDate, endDate)}
          onStop={endPause}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
  },
  message: {
    padding: 24,
    gap: 24,
  },
  rotationSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
});
