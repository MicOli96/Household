import { ReactNode } from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { shadow } from "./shadow";

type Props = {
  children: ReactNode;
  /** Gör kortet tryckbart. Utan onPress blir det ett vanligt kort. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

// Det vita kortet med rundade hörn som används för sysslor, medlemmar m.m.
// Innehållet läggs i en rad: ett namn till vänster och något till höger.
export function Card({ children, onPress, style }: Props) {
  const { colors } = useTheme();
  const cardStyle = [styles.card, { backgroundColor: colors.card }, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 10,
    ...shadow,
  },
  pressed: {
    opacity: 0.7,
  },
});
