import { AvatarEmoji } from "../theme/avatars";

// Typerna följer tabellerna i Supabase, så att testdatan kan bytas mot
// riktiga anrop utan att skärmarna behöver ändras.

/** household_members (namnet finns per hushåll) */
export type Member = {
  userId: string;
  name: string;
  avatar: AvatarEmoji;
  isOwner: boolean;
};

/** chores */
export type ChoreRow = {
  id: string;
  name: string;
  description: string;
  /** Hur ofta sysslan ska göras, i dagar (interval_days). */
  intervalDays: number;
  /** Hur energikrävande sysslan är: 1, 2, 4, 6 eller 8. */
  weight: 1 | 2 | 4 | 6 | 8;
  /** Rotationsgruppen sysslan ingår i (chore_group_id), eller null. */
  choreGroupId: string | null;
};

/** completions (created_at är när sysslan gjordes) */
export type Completion = {
  id: string;
  choreId: string;
  userId: string;
  createdAt: Date;
};

/** chore_assignments */
export type Assignment = {
  userId: string;
  choreId: string;
};

/** chore_groups */
export type ChoreGroup = {
  id: string;
  name: string;
  /** Hur många dagar varje person har gruppen innan den roterar. */
  rotationDays: number;
  startDate: Date;
};

/** En syssla som dagsvyn visar den, uträknad från tabellerna ovan. */
export type Chore = ChoreRow & {
  /** När sysslan senast gjordes, eller null om den aldrig gjorts. */
  lastDoneAt: Date | null;
  /** Avatarerna för dem som gjort sysslan idag. */
  doneTodayBy: AvatarEmoji[];
  /** Medlemmarna som har sysslan, manuellt eller via rotation. */
  assignees: Member[];
};
