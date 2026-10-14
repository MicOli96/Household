import { Assignment, ChoreGroup, ChoreRow, Completion, Member } from "./types";

// Testdata tills backend är klar. Samma sysslor som i lärarens skiss.

/** Skapar ett datum som ligger ett visst antal dagar bakåt i tiden. */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/** Den inloggade användaren tills inloggningen finns. Anna är ägare. */
export const CURRENT_PROFILE_ID = "anna";

export const mockMembers: Member[] = [
  { profileId: "anna", name: "Anna", avatar: "🦊", isOwner: true },
  { profileId: "erik", name: "Erik", avatar: "🐬", isOwner: false },
  { profileId: "lisa", name: "Lisa", avatar: "🐷", isOwner: false },
  { profileId: "olle", name: "Olle", avatar: "🐥", isOwner: false },
  { profileId: "maja", name: "Maja", avatar: "🐸", isOwner: false },
  { profileId: "sam", name: "Sam", avatar: "🐙", isOwner: false },
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
  { id: "c1", choreId: "1", profileId: "anna", doneAt: daysAgo(0) },
  { id: "c2", choreId: "1", profileId: "erik", doneAt: daysAgo(0) },
  { id: "c3", choreId: "1", profileId: "lisa", doneAt: daysAgo(0) },
  { id: "c4", choreId: "2", profileId: "erik", doneAt: daysAgo(7) },
  { id: "c5", choreId: "3", profileId: "olle", doneAt: daysAgo(0) },
  { id: "c6", choreId: "3", profileId: "maja", doneAt: daysAgo(0) },
  { id: "c7", choreId: "4", profileId: "lisa", doneAt: daysAgo(0) },
  { id: "c8", choreId: "5", profileId: "anna", doneAt: daysAgo(24) },
  { id: "c9", choreId: "6", profileId: "sam", doneAt: daysAgo(0) },
];

export const mockAssignments: Assignment[] = [
  { profileId: "anna", choreId: "1" },
  { profileId: "erik", choreId: "1" },
  { profileId: "anna", choreId: "2" },
  { profileId: "erik", choreId: "2" },
  { profileId: "anna", choreId: "4" },
  { profileId: "erik", choreId: "6" },
];
