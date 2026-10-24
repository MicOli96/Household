import "@/lib/localStorage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { currentRotationMember } from "../utils/rotation";
import {
  fetchHouseholdRows,
  HouseholdRows,
  insertChore,
  insertCompletion,
  insertGroup,
  updateChore,
  NewChore,
  saveAssignees,
} from "./chores";
import { ChoreMediaKind, LocalMediaFile, saveChoreMedia } from "./choreMedia";
import { useAuthSession } from "./AuthSession";
import { Chore, ChoreGroup, ChoreRow, Completion, Member } from "./types";

// Hushållets data för skärmarna. När ett hushåll är öppnat hämtas allt från
// Supabase (src/data/chores.ts). Utan öppnat hushåll är listorna tomma och
// dagsvyn skickar vidare till Mina hushåll.

const STORAGE_KEY = "householdId";

type HouseholdDataValue = {
  /** Hushållet som är öppnat, eller null när inget är valt. */
  householdId: string | null;
  openHousehold: (id: string | null) => void;
  loading: boolean;
  error: string;
  reload: () => void;
  members: Member[];
  currentMember: Member | null;
  /** Sysslorna i dagsvyn, utan de arkiverade. */
  chores: Chore[];
  /** Alla sysslor, även arkiverade, så att statistiken behåller dem (#63). */
  allChores: ChoreRow[];
  groups: ChoreGroup[];
  /** Gjorda sysslor som inte är ångrade, för statistiken. */
  completions: Completion[];
  markDone: (choreId: string) => Promise<void>;
  setAssignees: (choreId: string, userIds: string[]) => Promise<void>;
  addGroup: (name: string, rotationDays: number, choreIds: string[]) => Promise<void>;
  addChore: (chore: NewChore) => Promise<void>;
  editChore: (choreId: string, chore: NewChore) => Promise<void>;
  /** Lägger till eller byter sysslans bild eller ljud (#33). */
  addChoreMedia: (
    chore: Pick<ChoreRow, "id" | "householdId" | "imagePath" | "audioPath">,
    kind: ChoreMediaKind,
    file: LocalMediaFile,
  ) => Promise<void>;
};

const HouseholdDataContext = createContext<HouseholdDataValue | null>(null);

/** Rader som inte är borttagna, som .is("deleted_at", null) i Supabase. */
function active<T extends { deletedAt: Date | null }>(rows: T[]): T[] {
  return rows.filter((r) => r.deletedAt === null);
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

const emptyRows: HouseholdRows = {
  userId: "",
  members: [],
  choreRows: [],
  groups: [],
  assignments: [],
  completions: [],
};

function savedHouseholdId(userId: string): string | null {
  try {
    return localStorage.getItem(`${STORAGE_KEY}:${userId}`);
  } catch {
    return null;
  }
}

export function HouseholdDataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuthSession();
  const userId = session?.user.id;
  const [householdsByUser, setHouseholdsByUser] = useState<Record<string, string | null>>({});
  const householdId = userId
    ? Object.hasOwn(householdsByUser, userId)
      ? householdsByUser[userId]
      : savedHouseholdId(userId)
    : null;
  const queryClient = useQueryClient();

  // Användaren ingår i nyckeln eftersom datan säger vem som är inloggad (currentMember).
  const rowsQuery = useQuery({
    queryKey: ["chores", householdId, userId],
    queryFn: () => fetchHouseholdRows(householdId as string),
    enabled: !!householdId && !!userId,
  });
  const rows = rowsQuery.data ?? emptyRows;
  const loading = rowsQuery.isLoading;
  const error = rowsQuery.error
    ? (rowsQuery.error instanceof Error ? rowsQuery.error.message : "Kunde inte hämta sysslorna.")
    : "";

  const reload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["chores", householdId] });
  }, [queryClient, householdId]);

  const openHousehold = useCallback((id: string | null) => {
    if (!userId) return;
    const storageKey = `${STORAGE_KEY}:${userId}`;
    try {
      if (id) localStorage.setItem(storageKey, id);
      else localStorage.removeItem(storageKey);
    } catch {
    }
    setHouseholdsByUser((previous) => ({ ...previous, [userId]: id }));
  }, [userId]);

  function requireHousehold(): string {
    if (!householdId) throw new Error("Öppna ett hushåll under Mina hushåll först.");
    return householdId;
  }

  const members = useMemo(() => active(rows.members), [rows.members]);
  const currentMember = members.find((m) => m.userId === rows.userId) ?? null;
  const groups = useMemo(() => active(rows.groups), [rows.groups]);

  const chores = useMemo(() => {
    const today = new Date();
    const liveAssignments = active(rows.assignments);
    const liveCompletions = active(rows.completions);
    return active(rows.choreRows).filter((row) => !row.isArchived).map((row): Chore => {
      const done = liveCompletions
        .filter((c) => c.choreId === row.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const doneToday = done.filter((c) => isSameDay(c.createdAt, today));

      // Sysslor i en rotationsgrupp har den som har gruppen just nu.
      const group = groups.find((g) => g.id === row.choreGroupId);
      const rotating = group ? currentRotationMember(group, members, today) : null;
      const assignees = rotating
        ? [rotating]
        : members.filter((m) =>
            liveAssignments.some((a) => a.choreId === row.id && a.userId === m.userId),
          );

      return {
        ...row,
        lastDoneAt: done[0]?.createdAt ?? null,
        doneTodayBy: doneToday
          .map((c) => members.find((m) => m.userId === c.userId)?.avatar)
          .filter((a) => a != null),
        assignees,
      };
    });
  }, [rows, groups, members]);

  const value: HouseholdDataValue = {
    householdId,
    openHousehold,
    loading,
    error,
    reload,
    members,
    currentMember,
    chores,
    allChores: active(rows.choreRows),
    groups,
    completions: active(rows.completions),
    async markDone(choreId) {
      requireHousehold();
      await insertCompletion(choreId);
      reload();
    },
    async setAssignees(choreId, userIds) {
      requireHousehold();
      await saveAssignees(choreId, active(rows.assignments), userIds);
      reload();
    },
    async addGroup(name, rotationDays, choreIds) {
      await insertGroup(requireHousehold(), name, rotationDays, choreIds);
      reload();
    },
    async addChore(chore) {
      await insertChore(requireHousehold(), chore);
      reload();
    },
    async editChore(choreId, chore) {
      requireHousehold();
      await updateChore(choreId, chore);
      reload();
    },
    async addChoreMedia(chore, kind, file) {
      requireHousehold();
      await saveChoreMedia(chore, kind, file);
      reload();
    },
  };

  return (
    <HouseholdDataContext.Provider value={value}>{children}</HouseholdDataContext.Provider>
  );
}

export function useHouseholdData() {
  const data = useContext(HouseholdDataContext);
  if (!data) throw new Error("useHouseholdData must be used inside HouseholdDataProvider");
  return data;
}

export function useChores() {
  return useHouseholdData().chores;
}

export function useChore(id: string | undefined) {
  return useChores().find((c) => c.id === id);
}
