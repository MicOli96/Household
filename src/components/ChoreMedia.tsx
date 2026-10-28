import { useQuery } from "@tanstack/react-query";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import { choreMediaUrl, ChoreMediaKind, LocalMediaFile } from "../data/choreMedia";
import { useHouseholdData } from "../data/HouseholdData";
import type { ChoreRow } from "../data/types";
import { useTheme } from "../theme/ThemeProvider";
import { Card, PillButton } from "./ui";
import { errorMessage } from "../lib/errors";

type Props = {
  chore: Pick<ChoreRow, "id" | "householdId" | "imagePath" | "audioPath">;
};

// Bild och ljudinspelning till en syssla (#33). Visas i sysslans detaljvy.
export function ChoreMedia({ chore }: Props) {
  const { colors } = useTheme();
  const { addChoreMedia } = useHouseholdData();
  const [saving, setSaving] = useState<ChoreMediaKind | null>(null);
  const [error, setError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  async function save(kind: ChoreMediaKind, file: LocalMediaFile) {
    setSaving(kind);
    try {
      await addChoreMedia(chore, kind, file);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSaving(null);
    }
  }

  function denied(message: string) {
    setError(message);
    setPermissionDenied(true);
  }

  async function pickImage(source: "camera" | "library") {
    setError("");
    setPermissionDenied(false);
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        denied("Appen får inte använda kameran. Tillåt kameran i telefonens inställningar.");
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7 };
    try {
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const asset = result.assets[0];
      await save("image", { uri: asset.uri, mimeType: asset.mimeType });
    } catch {
      setError("Kunde inte öppna kameran eller bilderna. Försök igen.");
    }
  }

  async function startRecording() {
    setError("");
    setPermissionDenied(false);
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      denied("Appen får inte använda mikrofonen. Tillåt mikrofonen i telefonens inställningar.");
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      setError("Kunde inte starta inspelningen. Försök igen.");
    }
  }

  async function stopRecording() {
    try {
      await recorder.stop();
      // På iPhone hörs ljudet annars bara i hörluren.
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      setError("Kunde inte avsluta inspelningen. Försök igen.");
      return;
    }
    if (recorder.uri) await save("audio", { uri: recorder.uri });
  }

  const seconds = Math.floor(recorderState.durationMillis / 1000);

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.textMuted }]}>BILD</Text>
        {chore.imagePath ? <ChoreImage path={chore.imagePath} /> : null}
        {saving === "image" ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.row}>
            <PillButton
              label={chore.imagePath ? "Byt bild" : "Välj bild"}
              onPress={() => pickImage("library")}
              disabled={saving !== null}
              style={styles.button}
            />
            <PillButton
              label="Ta foto"
              onPress={() => pickImage("camera")}
              disabled={saving !== null}
              style={styles.button}
            />
          </View>
        )}

        <Text style={[styles.label, styles.audioLabel, { color: colors.textMuted }]}>LJUD</Text>
        {chore.audioPath && !recorderState.isRecording ? (
          <ChoreAudio path={chore.audioPath} />
        ) : null}
        {saving === "audio" ? (
          <ActivityIndicator color={colors.primary} />
        ) : recorderState.isRecording ? (
          <PillButton
            label={`■  Stoppa inspelningen (${seconds} s)`}
            variant="danger"
            onPress={stopRecording}
          />
        ) : (
          <PillButton
            label={chore.audioPath ? "● Spela in nytt ljud" : "● Spela in ljud"}
            onPress={startRecording}
            disabled={saving !== null}
          />
        )}

        {error ? (
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
        ) : null}
        {permissionDenied ? (
          <PillButton label="Öppna inställningar" onPress={() => Linking.openSettings()} />
        ) : null}
      </View>
    </Card>
  );
}

/** Den sparade filens tillfälliga länk, eftersom bucketen är privat. */
function useMediaUrl(path: string) {
  return useQuery({
    queryKey: ["chore-media", path],
    queryFn: () => choreMediaUrl(path),
    // Länken gäller en timme, så den hämtas om innan den slutar fungera.
    staleTime: 50 * 60 * 1000,
  });
}

function ChoreImage({ path }: { path: string }) {
  const { colors } = useTheme();
  const url = useMediaUrl(path);
  const [failed, setFailed] = useState(false);

  if (url.isLoading) return <ActivityIndicator color={colors.primary} />;
  if (url.error || failed) {
    return <Text style={{ color: colors.danger }}>Kunde inte visa bilden.</Text>;
  }
  return (
    <Image
      source={{ uri: url.data, cacheKey: path }}
      style={[styles.image, { backgroundColor: colors.border }]}
      contentFit="cover"
      accessibilityLabel="Bild till sysslan"
      onError={() => setFailed(true)}
    />
  );
}

function ChoreAudio({ path }: { path: string }) {
  const { colors } = useTheme();
  const url = useMediaUrl(path);
  const player = useAudioPlayer(url.data ?? null);
  const status = useAudioPlayerStatus(player);

  if (url.isLoading) return <ActivityIndicator color={colors.primary} />;
  if (url.error) return <Text style={{ color: colors.danger }}>Kunde inte hämta ljudet.</Text>;

  function toggle() {
    if (status.playing) {
      player.pause();
      return;
    }
    // Spelas från början igen när ljudet har spelats klart.
    if (status.duration > 0 && status.currentTime >= status.duration) player.seekTo(0);
    player.play();
  }

  return (
    <PillButton
      label={status.playing ? "❚❚  Pausa ljudet" : "▶  Spela upp ljudet"}
      variant="primary"
      onPress={toggle}
      disabled={!status.isLoaded}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "stretch",
  },
  content: {
    flex: 1,
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
  audioLabel: {
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },
  error: {
    fontSize: 14,
  },
});
