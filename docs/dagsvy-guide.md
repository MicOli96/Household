# Dagsvyn – steg för steg

Skelettet för dagsvyn är klart och går att köra. Det använder testdata (`src/data/mockChores.ts`) tills backend finns. Varje steg nedan motsvarar en `TODO (Sebastian, steg X)` i koden. Sök på `TODO (Sebastian` i VS Code för att hitta dem.

Gör en commit efter varje steg, så syns arbetet tydligt i historiken.

## Filer
| Fil | Vad den gör |
|---|---|
| `src/app/index.tsx` | Dagsvyn (startskärmen) |
| `src/app/settings.tsx` | Val av ljust/mörkt/auto |
| `src/components/ChoreCard.tsx` | Ett kort för en syssla |
| `src/utils/chores.ts` | Uträkningar: dagar sedan, försenad |
| `src/data/mockChores.ts` | Testdata och typen `Chore` |
| `src/theme/` | Färger och tema |

## Steg 1: Kör appen
```
git pull
npm install
npx expo start
```
Öppna i Expo Go på mobilen (skanna QR-koden). Du ska se sex sysslor. Knappen "Ändra" leder tillfälligt till temainställningarna.

## Steg 2: Försenade sysslor (`src/utils/chores.ts`)
Skriv klart `isOverdue`. En syssla är försenad om det gått fler dagar än `intervalDays` sedan den gjordes, eller om den aldrig gjorts.

Kontroll: "Torka golvet" (24 dagar, intervall 7) ska vara försenad, men "Damma" (7 dagar, intervall 14) ska inte vara det.

Commit: `git commit -am "Räkna ut om en syssla är försenad"`

## Steg 3: Röd bricka (`src/components/ChoreCard.tsx`)
Använd `overdue` för att välja färg: `colors.danger` som bakgrund och vit text när sysslan är försenad, annars som nu.
Tips: `backgroundColor: overdue ? colors.danger : colors.background`

Kontroll: "Torka golvet" ska få en röd bricka med 24.

Commit: `git commit -am "Visa försenade sysslor med röd bricka"`

## Steg 4: Raden "‹ idag ›" (`src/app/index.tsx`)
Lägg en `View` med `flexDirection: "row"` och `justifyContent: "space-between"` ovanför listan, med `‹`, `idag` och `›` som `Text`. Pilarna behöver inte göra något än.

Commit: `git commit -am "Lägg till datumrad i dagsvyn"`

## Steg 5: Detaljvy för syssla
1. Skapa `src/app/chore/[id].tsx`. Hakparenteserna gör att `id` blir en parameter i adressen.
2. Hämta id:t med `const { id } = useLocalSearchParams<{ id: string }>();` (från `expo-router`).
3. Leta upp sysslan: `mockChores.find((c) => c.id === id)`.
4. Visa namn och beskrivning samt en stor knapp "Markera som gjord" (den behöver inte spara något än).
5. I `index.tsx`: byt `Alert.alert(...)` mot ``router.push(`/chore/${item.id}`)`` (importera `router` från `expo-router`).

Krav som uppfylls: "När en användare väljer en syssla ska beskrivningen av sysslan visas och det ska även med ett enkelt tryck gå att markera sysslan som gjord."

Commit: `git add . && git commit -m "Lägg till detaljvy för syssla"`

## Steg 6: Knappen "Lägg till"
Gör en skärm `src/app/new-chore.tsx` med fälten från skissen: titel, beskrivning, återkommer (dagar) och värde (1, 2, 4, 6, 8). Öppna den med `onPress={() => router.push("/new-chore")}` på knappen, på samma sätt som "Ändra".
Tips: lägg till `<Stack.Screen name="new-chore" options={{ presentation: "modal", title: "Skapa en ny syssla" }} />` i `_layout.tsx` så öppnas den som en ruta, som i skissen.

Commit: `git add . && git commit -m "Lägg till formulär för ny syssla"`

## Innan du pushar
```
npx tsc --noEmit
git push
```
Inga fel från `tsc` = typerna stämmer.
