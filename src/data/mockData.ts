import { Assignment, ChoreGroup, ChoreRow, Completion, Member } from "./types";

// Testdata tills backend är klar. Samma sysslor som i lärarens skiss.

/** Skapar ett datum som ligger ett visst antal dagar bakåt i tiden. */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/** Den inloggade användaren tills inloggningen finns. Anna är ägare. */
export const CURRENT_USER_ID = "anna";

export const mockMembers: Member[] = [
  { userId: "anna", name: "Anna", avatar: "🦊", isOwner: true },
  { userId: "erik", name: "Erik", avatar: "🐬", isOwner: false },
  { userId: "lisa", name: "Lisa", avatar: "🐷", isOwner: false },
  { userId: "olle", name: "Olle", avatar: "🐥", isOwner: false },
  { userId: "maja", name: "Maja", avatar: "🐸", isOwner: false },
  { userId: "sam", name: "Sam", avatar: "🐙", isOwner: false },
];

export const mockGroups: ChoreGroup[] = [
  { id: "kok", name: "Köket", rotationDays: 7, startDate: daysAgo(10) },
];

export const mockChoreRows: ChoreRow[] = [
  { id: "1", name: "Laga mat", description: "Laga middag till alla i hushållet.", intervalDays: 1, weight: 4, choreGroupId: null },
  { id: "2", name: "Damma", description: "Damma av hyllor och fönsterbrädor.", intervalDays: 14, weight: 2, choreGroupId: null },
  { id: "3", name: "Diska", description: "Diska och torka av bänken.", intervalDays: 1, weight: 2, choreGroupId: "kok" },
  { id: "4", name: "Ta hand om My", description: "Mata katten och byt kattsand.", intervalDays: 1, weight: 2, choreGroupId: null },
  { id: "5", name: "Torka golvet", description: "Moppa golven i kök och hall.", intervalDays: 7, weight: 6, choreGroupId: "kok" },
  { id: "6", name: "Vattna blommorna", description: "Vattna alla krukväxter.", intervalDays: 3, weight: 1, choreGroupId: null },
];

export const mockCompletions: Completion[] = [
  { id: "c1", choreId: "1", userId: "anna", createdAt: daysAgo(0) },
  { id: "c2", choreId: "1", userId: "erik", createdAt: daysAgo(0) },
  { id: "c3", choreId: "1", userId: "lisa", createdAt: daysAgo(0) },
  { id: "c4", choreId: "2", userId: "erik", createdAt: daysAgo(7) },
  { id: "c5", choreId: "3", userId: "olle", createdAt: daysAgo(0) },
  { id: "c6", choreId: "3", userId: "maja", createdAt: daysAgo(0) },
  { id: "c7", choreId: "4", userId: "lisa", createdAt: daysAgo(0) },
  { id: "c8", choreId: "5", userId: "anna", createdAt: daysAgo(24) },
  { id: "c9", choreId: "6", userId: "sam", createdAt: daysAgo(0) },
];

export const mockAssignments: Assignment[] = [
  { userId: "anna", choreId: "1" },
  { userId: "erik", choreId: "1" },
  { userId: "anna", choreId: "2" },
  { userId: "erik", choreId: "2" },
  { userId: "anna", choreId: "4" },
  { userId: "erik", choreId: "6" },
];
