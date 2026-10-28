import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

// Delas av hela appen, så att utloggningen kan tömma samma cache som skärmarna använder.
export const queryClient = new QueryClient();

// På telefonen vet React Query inte själv när appen är öppen. Det här gör att
// skärmarnas data hämtas om när appen kommer tillbaka från bakgrunden, så att
// det andra i hushållet har gjort syns. Webbläsaren sköter det redan själv.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (status) => focusManager.setFocused(status === "active"));
}
