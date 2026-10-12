import { AvatarEmoji } from "../theme/avatars";

// Testdata för dagsvyn tills backend finns.
// När databasen är klar byts den här filen mot riktiga anrop till servern.


export type Chore = {
  id: string;
  name: string;
  description: string;
  /** Hur ofta sysslan ska göras, i dagar. */
  intervalDays: number;
  /** Hur energikrävande sysslan är: 1, 2, 4, 6 eller 8. */
  weight: 1 | 2 | 4 | 6 | 8;
  /** När sysslan senast gjordes, eller null om den aldrig gjorts. */
  lastDoneAt: Date | null;
  /** Avatarerna för dem som gjort sysslan idag. */
  doneTodayBy: AvatarEmoji[];
};

/** Skapar ett datum som ligger ett visst antal dagar bakåt i tiden. */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Samma sysslor som i lärarens skiss.
export const mockChores: Chore[] = [
  {
    id: "1",
    name: "Laga mat",
    description: "Laga middag till alla i hushållet.",
    intervalDays: 1,
    weight: 4,
    lastDoneAt: daysAgo(0),
    doneTodayBy: ["🦊", "🐬", "🐷"],
  },
  {
    id: "2",
    name: "Damma",
    description: "Damma av hyllor och fönsterbrädor.",
    intervalDays: 14,
    weight: 2,
    lastDoneAt: daysAgo(7),
    doneTodayBy: [],
  },
  {
    id: "3",
    name: "Diska",
    description: "Diska och torka av bänken.",
    intervalDays: 1,
    weight: 2,
    lastDoneAt: daysAgo(0),
    doneTodayBy: ["🐥", "🐸"],
  },
  {
    id: "4",
    name: "Ta hand om My",
    description: "Mata katten och byt kattsand.",
    intervalDays: 1,
    weight: 2,
    lastDoneAt: daysAgo(0),
    doneTodayBy: ["🐷"],
  },
  {
    id: "5",
    name: "Torka golvet",
    description: "Moppa golven i kök och hall.",
    intervalDays: 7,
    weight: 6,
    lastDoneAt: daysAgo(24),
    doneTodayBy: [],
  },
  {
    id: "6",
    name: "Vattna blommorna",
    description: "Vattna alla krukväxter.",
    intervalDays: 3,
    weight: 1,
    lastDoneAt: daysAgo(0),
    doneTodayBy: ["🐙"],
  },
];
