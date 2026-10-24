import { AvatarEmoji } from "../theme/avatars";

// Typerna följer tabellerna i Supabase, så att testdatan kan bytas mot
// riktiga anrop utan att skärmarna behöver ändras.

/**
 * Kolumnerna som finns i alla tabeller. Inget raderas på riktigt:
 * att ta bort något betyder att deletedAt sätts. Filtrera därför bort
 * rader där deletedAt inte är null, i Supabase med .is("deleted_at", null).
 */
export type Timestamps = {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

/** households */
export type Household = Timestamps & {
  id: string;
  name: string;
  code: string;
};

/** household_members. Namnet finns per hushåll. deletedAt sätts när man lämnar. */
export type Member = Timestamps & {
  userId: string;
  householdId: string;
  name: string;
  /** Avatar från avatars (avatar_id), null tills medlemmen valt en. */
  avatar: AvatarEmoji | null;
  isOwner: boolean;
  isApproved: boolean;
};

/** pauses */
export type Pause = Timestamps & {
  id: string;
  userId: string;
  householdId: string;
  startDate: Date;
  endDate: Date | null;
};

/** chores */
export type ChoreRow = Timestamps & {
  id: string;
  householdId: string;
  /** Rotationsgruppen sysslan ingår i (chore_group_id), eller null. */
  choreGroupId: string | null;
  name: string;
  description: string;
  /** Hur ofta sysslan ska göras, i dagar (interval_days). */
  intervalDays: number;
  /** Hur energikrävande sysslan är: 1, 2, 4, 6 eller 8. */
  weight: 1 | 2 | 4 | 6 | 8;
  imagePath: string | null;
  audioPath: string | null;
  isArchived: boolean;
};

/** completions. createdAt är när sysslan gjordes. */
export type Completion = Timestamps & {
  id: string;
  choreId: string;
  userId: string;
};

/** chore_assignments */
export type Assignment = Timestamps & {
  id: string;
  userId: string;
  choreId: string;
};

/** chore_groups */
export type ChoreGroup = Timestamps & {
  id: string;
  householdId: string;
  name: string;
  /** Hur många dagar varje person har gruppen innan den roterar. */
  rotationDays: number;
  startDate: Date;
};

/** En syssla som dagsvyn visar den, uträknad från tabellerna ovan. */
export type Chore = ChoreRow & {
  /** När sysslan senast gjordes, eller null om den aldrig gjorts. */
  lastDoneAt: Date | null;
  /** Utförarna idag, inklusive personer som ännu inte valt avatar. */
  completedTodayBy: Member[];
  /** Utförarna den senaste kalenderdag sysslan gjordes. */
  lastCompletedBy: Member[];
  /** Medlemmarna som har sysslan, manuellt eller via rotation. */
  assignees: Member[];
};
