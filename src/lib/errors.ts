/** Ett fel vars text är skriven för att visas i appen. */
export class UserError extends Error {}

/**
 * Texten som ska visas för ett fel. Oväntade fel, till exempel från nätverket
 * eller Supabase, får en allmän text så att tekniska detaljer inte syns.
 */
export function errorMessage(error: unknown): string {
  return error instanceof UserError
    ? error.message
    : "Kunde inte ansluta. Kontrollera anslutningen och appens inställningar.";
}
