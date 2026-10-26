import { File } from "expo-file-system";
import { Platform } from "react-native";

import { requireUser, supabase } from "../lib/supabase";
import type { ChoreRow } from "./types";

// Bild och ljud till sysslor (#33). Filerna ligger i den privata bucketen
// chore-media i en mapp per hushåll, och sökvägen sparas i chores med
// set_chore_media. Alla medlemmar i hushållet får lägga till och se filerna.

const BUCKET = "chore-media";

export type ChoreMediaKind = "image" | "audio";

/** En fil på telefonen, från kameran, bildbiblioteket eller inspelningen. */
export type LocalMediaFile = { uri: string; mimeType?: string | null };

const fallbackMimeTypes: Record<ChoreMediaKind, string> = {
  image: "image/jpeg",
  audio: "audio/mp4",
};

const extensionsByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/webp": "webp",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/webm": "webm",
  "audio/mpeg": "mp3",
};

/** Ljudfiler från inspelningen saknar mimeType, så den gissas från filändelsen. */
function mimeTypeFor(kind: ChoreMediaKind, file: LocalMediaFile): string {
  if (file.mimeType) return file.mimeType;
  const extension = file.uri.split("?")[0].split(".").pop()?.toLowerCase();
  const match = Object.entries(extensionsByMimeType).find(
    ([type, ext]) => ext === extension && type.startsWith(kind),
  );
  return match?.[0] ?? fallbackMimeTypes[kind];
}

/**
 * fetch(uri).arrayBuffer() läser inte lokala filer (file://) på telefonen, så
 * filen blev bara 14 byte i storage. Där läses den med expo-file-system.
 * På webben är uri en blob:-länk som fetch läser rätt, och File finns inte där.
 */
async function readLocalFile(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === "web") return fetch(uri).then((response) => response.arrayBuffer());
  return new File(uri).arrayBuffer();
}

/**
 * Laddar upp en bild eller ett ljud och kopplar filen till sysslan. Filnamnet
 * får en tidsstämpel så att en ny fil inte visas med en gammal sparad länk.
 * Den tidigare filen tas bort efteråt.
 */
export async function saveChoreMedia(
  chore: Pick<ChoreRow, "id" | "householdId" | "imagePath" | "audioPath">,
  kind: ChoreMediaKind,
  file: LocalMediaFile,
): Promise<void> {
  await requireUser();
  const contentType = mimeTypeFor(kind, file);
  const extension = extensionsByMimeType[contentType] ?? (kind === "image" ? "jpg" : "m4a");
  const path = `${chore.householdId}/${chore.id}-${kind}-${Date.now()}.${extension}`;

  let body: ArrayBuffer;
  try {
    body = await readLocalFile(file.uri);
  } catch {
    throw new Error("Kunde inte läsa filen på telefonen. Försök igen.");
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType, upsert: false });
  if (uploadError) {
    throw new Error("Kunde inte ladda upp filen. Kontrollera anslutningen och försök igen.");
  }

  const previous = kind === "image" ? chore.imagePath : chore.audioPath;
  const { error } = await supabase.rpc("set_chore_media", {
    p_chore_id: chore.id,
    p_image_path: kind === "image" ? path : chore.imagePath,
    p_audio_path: kind === "audio" ? path : chore.audioPath,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error("Kunde inte spara filen till sysslan. Bara medlemmar i hushållet kan lägga till filer.");
  }

  // Den gamla filen behövs inte längre. Misslyckas det ligger den bara kvar.
  if (previous) await supabase.storage.from(BUCKET).remove([previous]);
}

/** Bucketen är privat, så filerna visas med en länk som gäller en timme. */
export async function choreMediaUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data) throw new Error("Kunde inte hämta filen. Försök igen.");
  return data.signedUrl;
}
