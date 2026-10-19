import "expo-sqlite/localStorage/install";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

function savedHouseholdId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function HouseholdDataProvider({ children }: { children: ReactNode }) {
  const [householdId, setHouseholdId] = useState<string | null>(savedHouseholdId);
  const [rows, setRows] = useState<HouseholdRows>(emptyRows);
  const { session } = useAuthSession();
  const userId = session?.user.id;
  const [loading, setLoading] = useState(householdId !== null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!householdId || !userId) return;
    let current = true;
    fetchHouseholdRows(householdId)
      .then((result) => { if (current) { setRows(result); setError(""); } })
      .catch((reason: unknown) => {
        if (current) setError(reason instanceof Error ? reason.message : "Kunde inte hämta sysslorna.");
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [householdId, userId, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const openHousehold = useCallback((id: string | null) => {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
    if (!id) setRows(emptyRows);
    setLoading(id !== null);
    setError("");
    setHouseholdId(id);
  }, []);

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
