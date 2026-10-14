import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { currentRotationMember } from "../utils/rotation";
import {
  CURRENT_USER_ID,
  mockAssignments,
  mockChoreRows,
  mockCompletions,
  mockGroups,
  mockMembers,
  timestamps,
} from "./mockData";
import { Assignment, Chore, ChoreGroup, Completion, Member } from "./types";

// Hushållets data för skärmarna. Just nu ligger allt i minnet med testdata.
// När backend är klar byts innehållet här mot anrop till Supabase,
// medan hooksen längst ner (useChores m.fl.) ser likadana ut.

type HouseholdDataValue = {
  members: Member[];
  currentMember: Member;
  chores: Chore[];
  groups: ChoreGroup[];
  /** Alla gjorda sysslor, används av statistiken. */
  completions: Completion[];
  markDone: (choreId: string) => void;
  setAssignees: (choreId: string, userIds: string[]) => void;
  addGroup: (name: string, rotationDays: number, choreIds: string[]) => void;
};

const HouseholdDataContext = createContext<HouseholdDataValue | null>(null);

/** Rader som inte är borttagna, som .is("deleted_at", null) i Supabase. */
function active<T extends { deletedAt: Date | null }>(rows: T[]): T[] {
  return rows.filter((r) => r.deletedAt === null);
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function HouseholdDataProvider({ children }: { children: ReactNode }) {
  const [choreRows, setChoreRows] = useState(mockChoreRows);
  const [completions, setCompletions] = useState<Completion[]>(mockCompletions);
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [groups, setGroups] = useState<ChoreGroup[]>(mockGroups);
  const members = useMemo(() => active(mockMembers), []);
  const currentMember = members.find((m) => m.userId === CURRENT_USER_ID)!;

  const chores = useMemo(() => {
    const today = new Date();
    const liveGroups = active(groups);
    const liveAssignments = active(assignments);
    return active(choreRows).filter((row) => !row.isArchived).map((row): Chore => {
      const done = active(completions)
        .filter((c) => c.choreId === row.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const doneToday = done.filter((c) => isSameDay(c.createdAt, today));

      // Sysslor i en rotationsgrupp har den som har gruppen just nu.
      const group = liveGroups.find((g) => g.id === row.choreGroupId);
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
          .filter((a) => a !== undefined),
        assignees,
      };
    });
  }, [choreRows, completions, assignments, groups, members]);

  const value: HouseholdDataValue = {
    members,
    currentMember,
    chores,
    groups: active(groups),
    completions: active(completions),
    markDone(choreId) {
      setCompletions((prev) => [
        ...prev,
        {
          id: `c${Date.now()}`,
          choreId,
          userId: currentMember.userId,
          ...timestamps(),
        },
      ]);
    },
    setAssignees(choreId, userIds) {
      // Inget raderas: borttagna tilldelningar får deletedAt, nya läggs till.
      const now = new Date();
      setAssignments((prev) => {
        const kept = prev.map((a) =>
          a.choreId === choreId && a.deletedAt === null && !userIds.includes(a.userId)
            ? { ...a, deletedAt: now, updatedAt: now }
            : a,
        );
        const added = userIds
          .filter((userId) =>
            !kept.some((a) => a.choreId === choreId && a.userId === userId && a.deletedAt === null),
          )
          .map((userId) => ({ id: `a${now.getTime()}${userId}`, userId, choreId, ...timestamps(now) }));
        return [...kept, ...added];
      });
    },
    addGroup(name, rotationDays, choreIds) {
      const id = `g${Date.now()}`;
      const now = new Date();
      setGroups((prev) => [
        ...prev,
        { id, householdId: currentMember.householdId, name, rotationDays, startDate: now, ...timestamps(now) },
      ]);
      setChoreRows((prev) =>
        prev.map((c) =>
          choreIds.includes(c.id) ? { ...c, choreGroupId: id, updatedAt: now } : c,
        ),
      );
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
