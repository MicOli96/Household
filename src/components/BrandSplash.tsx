import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text } from "react-native";

// Loggan på orange bakgrund när appen startar, sedan tonar den bort.
// Den inbyggda splashen (app.json) syns bara i en riktig build,
// så den här gör att loggan syns även i Expo Go.
const SHOW_MS = 1000;
const FADE_MS = 400;

export function BrandSplash() {
  const opacity = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_MS,
      delay: SHOW_MS,
      useNativeDriver: true,
    });
    animation.start(() => setVisible(false));
    return () => animation.stop();
  }, [opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      <Image
        source={require("../../assets/images/splash-icon.png")}
        style={styles.logo}
      />
      <Text style={styles.name}>Hushållet</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#FF8A4C",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logo: {
    width: 200,
    height: 200,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
});
