import {
  Assignment,
  ChoreGroup,
  ChoreRow,
  Completion,
  Household,
  Member,
  Timestamps,
} from "./types";

// Testdata tills backend är klar. Samma sysslor som i lärarens skiss.

/** Skapar ett datum som ligger ett visst antal dagar bakåt i tiden. */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/** Tidsstämplar för en ny rad, som databasen sätter dem. */
export function timestamps(createdAt: Date = new Date()): Timestamps {
  return { createdAt, updatedAt: createdAt, deletedAt: null };
}

/** Den inloggade användaren tills inloggningen finns. Anna är ägare. */
export const CURRENT_USER_ID = "anna";

export const mockHousehold: Household = {
  id: "svensson",
  name: "Familjen Svensson",
  code: "4F7K2",
  ...timestamps(daysAgo(60)),
};

const HOUSEHOLD_ID = mockHousehold.id;

function member(userId: string, name: string, avatar: Member["avatar"], isOwner = false): Member {
  return {
    userId,
    householdId: HOUSEHOLD_ID,
    name,
    avatar,
    isOwner,
    isApproved: true,
    ...timestamps(daysAgo(60)),
  };
}

export const mockMembers: Member[] = [
  member("anna", "Anna", "🦊", true),
  member("erik", "Erik", "🐬"),
  member("lisa", "Lisa", "🐷"),
  member("olle", "Olle", "🐥"),
  member("maja", "Maja", "🐸"),
  member("sam", "Sam", "🐙"),
];

export const mockGroups: ChoreGroup[] = [
  {
    id: "kok",
    householdId: HOUSEHOLD_ID,
    name: "Köket",
    rotationDays: 7,
    startDate: daysAgo(10),
    ...timestamps(daysAgo(10)),
  },
];

function chore(
  id: string,
  name: string,
  description: string,
  intervalDays: number,
  weight: ChoreRow["weight"],
  choreGroupId: string | null = null,
): ChoreRow {
  return {
    id,
    householdId: HOUSEHOLD_ID,
    choreGroupId,
    name,
    description,
    intervalDays,
    weight,
    imagePath: null,
    audioPath: null,
    isArchived: false,
    ...timestamps(daysAgo(60)),
  };
}

export const mockChoreRows: ChoreRow[] = [
  chore("1", "Laga mat", "Laga middag till alla i hushållet.", 1, 4),
  chore("2", "Damma", "Damma av hyllor och fönsterbrädor.", 14, 2),
  chore("3", "Diska", "Diska och torka av bänken.", 1, 2, "kok"),
  chore("4", "Ta hand om My", "Mata katten och byt kattsand.", 1, 2),
  chore("5", "Torka golvet", "Moppa golven i kök och hall.", 7, 6, "kok"),
  chore("6", "Vattna blommorna", "Vattna alla krukväxter.", 3, 1),
  // Arkiverad: syns inte i dagsvyn men finns kvar i statistiken (#63).
  { ...chore("7", "Klippa gräset", "Klipp gräsmattan på framsidan.", 7, 4), isArchived: true },
];

function completion(id: string, choreId: string, userId: string, days: number): Completion {
  return { id, choreId, userId, ...timestamps(daysAgo(days)) };
}

export const mockCompletions: Completion[] = [
  completion("c1", "1", "anna", 0),
  completion("c2", "1", "erik", 0),
  completion("c3", "1", "lisa", 0),
  completion("c4", "2", "erik", 7),
  completion("c5", "3", "olle", 0),
  completion("c6", "3", "maja", 0),
  completion("c7", "4", "lisa", 0),
  completion("c8", "5", "anna", 24),
  completion("c9", "6", "sam", 0),
  completion("c10", "7", "olle", 0),
  // Fler under veckan, så att statistiken har något att visa.
  completion("c10", "1", "olle", 1),
  completion("c11", "3", "anna", 1),
  completion("c12", "4", "lisa", 2),
  completion("c13", "1", "maja", 2),
  completion("c14", "6", "erik", 3),
  completion("c15", "4", "anna", 3),
];

function assignment(id: string, userId: string, choreId: string): Assignment {
  return { id, userId, choreId, ...timestamps(daysAgo(30)) };
}

export const mockAssignments: Assignment[] = [
  assignment("a1", "anna", "1"),
  assignment("a2", "erik", "1"),
  assignment("a3", "anna", "2"),
  assignment("a4", "erik", "2"),
  assignment("a5", "anna", "4"),
  assignment("a6", "erik", "6"),
];
