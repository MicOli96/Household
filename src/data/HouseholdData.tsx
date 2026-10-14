import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { currentRotationMember } from "../utils/rotation";
import {
  CURRENT_USER_ID,
  mockAssignments,
  mockChoreRows,
  mockCompletions,
  mockGroups,
  mockMembers,
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
  markDone: (choreId: string) => void;
  setAssignees: (choreId: string, userIds: string[]) => void;
  addGroup: (name: string, rotationDays: number, choreIds: string[]) => void;
};

const HouseholdDataContext = createContext<HouseholdDataValue | null>(null);

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function HouseholdDataProvider({ children }: { children: ReactNode }) {
  const [choreRows, setChoreRows] = useState(mockChoreRows);
  const [completions, setCompletions] = useState<Completion[]>(mockCompletions);
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [groups, setGroups] = useState<ChoreGroup[]>(mockGroups);
  const members = mockMembers;
  const currentMember = members.find((m) => m.userId === CURRENT_USER_ID)!;

  const chores = useMemo(() => {
    const today = new Date();
    return choreRows.map((row): Chore => {
      const done = completions
        .filter((c) => c.choreId === row.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const doneToday = done.filter((c) => isSameDay(c.createdAt, today));

      // Sysslor i en rotationsgrupp har den som har gruppen just nu.
      const group = groups.find((g) => g.id === row.choreGroupId);
      const rotating = group ? currentRotationMember(group, members, today) : null;
      const assignees = rotating
        ? [rotating]
        : members.filter((m) =>
            assignments.some((a) => a.choreId === row.id && a.userId === m.userId),
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
    groups,
    markDone(choreId) {
      setCompletions((prev) => [
        ...prev,
        {
          id: `c${Date.now()}`,
          choreId,
          userId: currentMember.userId,
          createdAt: new Date(),
        },
      ]);
    },
    setAssignees(choreId, userIds) {
      setAssignments((prev) => [
        ...prev.filter((a) => a.choreId !== choreId),
        ...userIds.map((userId) => ({ userId, choreId })),
      ]);
    },
    addGroup(name, rotationDays, choreIds) {
      const id = `g${Date.now()}`;
      setGroups((prev) => [...prev, { id, name, rotationDays, startDate: new Date() }]);
      setChoreRows((prev) =>
        prev.map((c) => (choreIds.includes(c.id) ? { ...c, choreGroupId: id } : c)),
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
