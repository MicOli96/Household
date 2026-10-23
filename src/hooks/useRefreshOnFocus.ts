import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";

// Hämtar om när man kommer tillbaka till skärmen, så att ändringar som andra
// har gjort syns. React Query hämtar redan första gången skärmen visas.
export function useRefreshOnFocus(refetch: () => unknown) {
  const firstTime = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstTime.current) {
        firstTime.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
