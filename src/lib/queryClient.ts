import { QueryClient } from "@tanstack/react-query";

// Delas av hela appen, så att utloggningen kan tömma samma cache som skärmarna använder.
export const queryClient = new QueryClient();
