import { StyleSheet, Text, View } from "react-native";
import type { MemberSummary } from "../data/households";
import { useTheme } from "../theme/ThemeProvider";
import { Avatar, Card, PillButton } from "./ui";

type Props = {
  /** Bara förfrågningar (isApproved = false), household.tsx har redan filtrerat. */
  requests: MemberSummary[];
  /** Anropas när ägaren trycker på Godkänn. */
  onApprove: (request: MemberSummary) => void;
  /** Anropas när ägaren trycker på Neka. */
  onDeny: (request: MemberSummary) => void;
  /** Stänger av knapparna medan ett svar skickas, så att man inte trycker två gånger. */
  disabled: boolean;
};

const AVATAR_SIZE = 32;

// Visar vem som vill gå med (#17) och låter ägaren godkänna eller neka (#18).
export function RequestList(props: Props) {
  const { colors } = useTheme();

  if (props.requests.length === 0) {
    return null;
  }
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>
        FÖRFRÅGNINGAR
      </Text>

      {props.requests.map((request) => (
        <Card key={request.userId}>
          <View style={styles.person}>
            {request.avatar ? (
              <Avatar emoji={request.avatar} size={AVATAR_SIZE} />
            ) : (
              // Ingen avatar vald än.
              <View
                style={[styles.noAvatar, { backgroundColor: colors.border }]}
              >
                <Text style={{ color: colors.textMuted }}>?</Text>
              </View>
            )}
            <View style={styles.texts}>
              <Text
                style={[styles.name, { color: colors.text }]}
                numberOfLines={1}
              >
                {request.name || "Inget namn"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Vill gå med
              </Text>
            </View>
          </View>
          <View style={styles.buttons}>
            <PillButton
              label="Neka"
              variant="danger"
              style={styles.button}
              disabled={props.disabled}
              onPress={() => props.onDeny(request)}
            />
            <PillButton
              label="Godkänn"
              variant="primary"
              style={styles.button}
              disabled={props.disabled}
              onPress={() => props.onApprove(request)}
            />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  noAvatar: {
    // Samma yttre storlek som Avatar, som har en ring på 4 px runt cirkeln.
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    flexShrink: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  // Mindre än vanliga PillButton så att namnet får plats bredvid på en telefon.
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
