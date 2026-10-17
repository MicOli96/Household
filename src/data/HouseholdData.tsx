import "expo-sqlite/localStorage/install";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { currentRotationMember } from "../utils/rotation";
import {
  fetchHouseholdRows,
  HouseholdRows,
  insertChore,
  insertCompletion,
  insertGroup,
  NewChore,
  saveAssignees,
} from "./chores";
import {
  CURRENT_USER_ID,
  mockAssignments,
  mockChoreRows,
  mockCompletions,
  mockGroups,
  mockHousehold,
  mockMembers,
  timestamps,
} from "./mockData";
import { Chore, ChoreGroup, ChoreRow, Completion, Member } from "./types";

// Hushållets data för skärmarna. När ett hushåll är öppnat hämtas allt från
// Supabase (src/data/chores.ts). Innan dess visas testdatan, så att skärmarna
// går att prova utan konto. Hooksen längst ner ser likadana ut i båda fallen.

const STORAGE_KEY = "householdId";

type HouseholdDataValue = {
  /** Hushållet som är öppnat, eller null när testdatan visas. */
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
};

const HouseholdDataContext = createContext<HouseholdDataValue | null>(null);

/** Rader som inte är borttagna, som .is("deleted_at", null) i Supabase. */
function active<T extends { deletedAt: Date | null }>(rows: T[]): T[] {
  return rows.filter((r) => r.deletedAt === null);
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

const mockRows: HouseholdRows = {
  userId: CURRENT_USER_ID,
  members: mockMembers,
  choreRows: mockChoreRows,
  groups: mockGroups,
  assignments: mockAssignments,
  completions: mockCompletions,
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
  const [rows, setRows] = useState<HouseholdRows>(mockRows);
  const [loading, setLoading] = useState(householdId !== null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!householdId) return;
    let current = true;
    fetchHouseholdRows(householdId)
      .then((result) => { if (current) { setRows(result); setError(""); } })
      .catch((reason: unknown) => {
        if (current) setError(reason instanceof Error ? reason.message : "Kunde inte hämta sysslorna.");
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [householdId, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const openHousehold = useCallback((id: string | null) => {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
    if (!id) setRows(mockRows);
    setLoading(id !== null);
    setError("");
    setHouseholdId(id);
  }, []);

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
      if (householdId) {
        await insertCompletion(choreId);
        return reload();
      }
      setRows((prev) => ({
        ...prev,
        completions: [
          ...prev.completions,
          { id: `c${Date.now()}`, choreId, userId: prev.userId, ...timestamps() },
        ],
      }));
    },
    async setAssignees(choreId, userIds) {
      if (householdId) {
        await saveAssignees(choreId, active(rows.assignments), userIds);
        return reload();
      }
      // Inget raderas: borttagna tilldelningar får deletedAt, nya läggs till.
      const now = new Date();
      setRows((prev) => {
        const kept = prev.assignments.map((a) =>
          a.choreId === choreId && a.deletedAt === null && !userIds.includes(a.userId)
            ? { ...a, deletedAt: now, updatedAt: now }
            : a,
        );
        const added = userIds
          .filter((userId) =>
            !kept.some((a) => a.choreId === choreId && a.userId === userId && a.deletedAt === null),
          )
          .map((userId) => ({ id: `a${now.getTime()}${userId}`, userId, choreId, ...timestamps(now) }));
        return { ...prev, assignments: [...kept, ...added] };
      });
    },
    async addGroup(name, rotationDays, choreIds) {
      if (householdId) {
        await insertGroup(householdId, name, rotationDays, choreIds);
        return reload();
      }
      const id = `g${Date.now()}`;
      const now = new Date();
      setRows((prev) => ({
        ...prev,
        groups: [
          ...prev.groups,
          { id, householdId: mockHousehold.id, name, rotationDays, startDate: now, ...timestamps(now) },
        ],
        choreRows: prev.choreRows.map((c) =>
          choreIds.includes(c.id) ? { ...c, choreGroupId: id, updatedAt: now } : c,
        ),
      }));
    },
    async addChore(chore) {
      if (householdId) {
        await insertChore(householdId, chore);
        return reload();
      }
      const now = new Date();
      setRows((prev) => ({
        ...prev,
        choreRows: [
          ...prev.choreRows,
          {
            id: `ch${now.getTime()}`,
            householdId: mockHousehold.id,
            choreGroupId: null,
            name: chore.name.trim(),
            description: chore.description.trim(),
            intervalDays: chore.intervalDays,
            weight: chore.weight,
            imagePath: null,
            audioPath: null,
            isArchived: false,
            ...timestamps(now),
          },
        ],
      }));
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
