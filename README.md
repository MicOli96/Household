# Hushållet

En app för familjer, sambos och släktingar som delar på sysslorna i hemmet. Man skapar ett hushåll eller ansöker om att gå med i ett med en kod, väljer en djuravatar och ser i en dagsvy vilka sysslor som behöver göras och vilka som är försenade. Man markerar sysslor som gjorda och ser statistik över vem som har gjort mest, viktat efter hur jobbiga sysslorna är.

Byggd med React Native, Expo och TypeScript som inlämning 2 i kursen. Produktägare: David Jensen.

## Läget just nu

Nästan alla krav i kravspecen är byggda och ligger på `main`. Det som återstår är att kunna lämna ett hushåll (#26) och de förbättringar av navigeringen och profilen som kom fram efter granskningen (#104–#108). Se [Krav](#krav) och [Kvar att göra](#kvar-att-göra) nedan.

## Funktioner

- **Konto:** registrera dig och logga in med e-post och lösenord, logga ut.
- **Hushåll:** skapa ett hushåll med namn och en genererad kod, byt namn, ansök om att gå med med koden och vänta på att en ägare godkänner. Har du flera hushåll väljer du vilket du vill öppna i Mina hushåll.
- **Medlemmar:** alla ser vilka som är med. Ägare ser förfrågningar, godkänner eller nekar dem, gör andra till ägare och pausar medlemmar under en period.
- **Profil:** ange ditt namn och välj en djuravatar. Avatarer som någon annan i hushållet redan har går inte att välja.
- **Sysslor:** ägare skapar, redigerar, arkiverar och tar bort sysslor med namn, beskrivning, intervall i dagar och vikt (1, 2, 4, 6 eller 8). Till en syssla kan man lägga en bild och en ljudinspelning. Innan en syssla tas bort varnas man för att statistiken försvinner och kan arkivera den i stället.
- **Dagsvy:** listar sysslorna med vem som gjort dem i dag, hur många dagar sedan de gjordes och om de är försenade. I detaljvyn ser man beskrivningen och markerar sysslan som gjord med ett tryck.
- **Schemaläggning:** ägare tilldelar sysslor till medlemmar och skapar rotationsgrupper där sysslorna roteras automatiskt mellan medlemmarna.
- **Statistik:** cirkeldiagram över fördelningen totalt (med vikter) och per syssla, för nuvarande vecka, förra veckan och förra månaden. Vyer utan statistik visas inte. Pausade perioder räknas inte med, och poängen normaliseras efter hur många dagar medlemmen var aktiv.
- **Utseende:** ljust, mörkt eller auto (följer telefonen). Valet sparas i telefonen.

## Teknik

| Del | Vad vi använder |
|---|---|
| App | React Native 0.88, Expo SDK 58, TypeScript |
| Navigering | Expo Router (filbaserad, en `Stack` i `src/app/_layout.tsx`) |
| Data och cache | TanStack React Query, `HouseholdData` och `AuthSession` som React-context |
| Backend | Supabase: Postgres med RLS, inloggning och lagring av filer (bucketen `chore-media`) |
| Validering | Zod |
| Bild och ljud | `expo-image-picker`, `expo-audio`, `expo-image` |
| Diagram | `react-native-svg` (egen `PieChart`) |
| Kontroller | ESLint (`eslint-config-expo`), `tsc`, GitHub Actions |

## Kom igång

Du behöver [Node.js](https://nodejs.org) (version 22) och appen [Expo Go](https://expo.dev/go) på mobilen.

```bash
git clone https://github.com/MicOli96/Household.git
cd Household
npm install
npx expo start
```

Skanna QR-koden med kameran (iPhone) eller i Expo Go (Android). Tryck `w` i terminalen för att öppna appen i webbläsaren i stället.

### Miljövariabler

Appen läser två variabler från `.env`:

| Variabel | Innehåll |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Adressen till Supabase-projektet |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Projektets publishable key |

`.env` ligger i git, så det behövs ingen egen fil. Värdena är publika och byggs in i appen. Det är reglerna i databasen (RLS) som skyddar datan. Lägg **aldrig** in secret key (service_role) eller databaslösenordet i `.env`.

Har du en gammal `.env.local` från tidigare, ta bort den. Den läses före `.env` och kan ge fel värden. Starta om med `npx expo start -c` efter att värdena har ändrats, eftersom de byggs in i appen.

### Databasen

Databasen beskrivs av filerna i `supabase/migrations/`. Ändra inte tabeller direkt i Supabase, lägg till en ny migration i stället så att alla har samma databas. Så här kopplar du terminalen till projektet och skickar upp migrationerna:

```bash
npx supabase login
npx supabase link --project-ref <projekt-id>
npx supabase db push
```

`supabase/tests/medlemskap.sql` kontrollerar reglerna för medlemskap, till exempel att ingen kan göra sig själv till ägare. Det körs i en transaktion som rullas tillbaka, och instruktionerna står överst i filen.

### Kontroller

Samma kontroller körs automatiskt i GitHub Actions på varje PR mot `main`. Kör dem gärna själv innan du pushar:

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # Tester för uträkningarna i src/utils
```

## Databasstruktur

Alla tabeller har `created_at`, `updated_at` och `deleted_at`. Inget raderas på riktigt från appen; att ta bort något betyder att `deleted_at` sätts. Användarna ligger i Supabase egen `auth.users`, så det finns ingen profiltabell. Namn och avatar sparas per hushåll.

| Tabell | Innehåll |
|---|---|
| `avatars` | Den fasta listan med djuravatarer (emoji och färg). |
| `households` | Hushållets namn och kod för att gå med. |
| `household_members` | Vem som är med i vilket hushåll: namn, avatar, `is_owner` och `is_approved`. En rad som inte är godkänd är en förfrågan. Två i samma hushåll kan inte ha samma avatar. |
| `pauses` | Perioder (`start_date`–`end_date`) då en medlem är pausad. |
| `chore_groups` | Rotationsgrupper med hur många dagar det går mellan varje byte. |
| `chores` | Sysslor: namn, beskrivning, `interval_days`, `weight`, sökväg till bild och ljud, `is_archived` och eventuell grupp. |
| `chore_assignments` | Vilka medlemmar en syssla är tilldelad. |
| `completions` | En rad varje gång någon markerar en syssla som gjord. |

Funktioner som appen anropar med `supabase.rpc(...)`:

- `create_household(p_name)` skapar hushållet och gör den inloggade till godkänd ägare.
- `join_household(p_code)` skickar en förfrågan om att gå med.
- `set_chore_media(p_chore_id, p_image_path, p_audio_path)` sparar bild och ljud till en syssla.
- `delete_chore(p_chore_id)` tar bort en syssla tillsammans med dess markeringar och tilldelningar (bara ägare).

Det finns också vyn `chores_with_last_done` och funktionen `household_stats`, som räknar poäng per medlem och syssla med normalisering för pauser. Reglerna (RLS) ser till att man bara kommer åt hushåll man är godkänd medlem i och att bara ägare kan ändra sysslor och medlemmar.

## Projektstruktur

| Mapp | Innehåll |
|---|---|
| `src/app/` | Skärmar. Varje fil är en route (Expo Router), `_layout.tsx` styr navigeringen. |
| `src/components/ui/` | Gemensamma komponenter: `PillButton`, `Card`, `Badge`, `Avatar`, `TextField`, `AppModal`, `ConfirmDialog`, `CheckRow`, `SegmentedControl`, `Icon`. |
| `src/components/` | Komponenter för en viss vy, t.ex. `ChoreCard`, `ChoreForm`, `MemberList`, `PieChart`. |
| `src/data/` | Anrop till Supabase (`households.ts`, `chores.ts`, `pauses.ts`, `profile.ts`, `choreMedia.ts`, `auth.ts`), typer som följer tabellerna (`types.ts`), `HouseholdData` med hooks som `useHouseholdData()` och `AuthSession` med den inloggade användaren. |
| `src/hooks/` | Hooks för formulär och för att hämta om data när en skärm visas. |
| `src/utils/` | Uträkningar: försenade sysslor, rotation, statistik och validering. |
| `src/lib/` | Supabase-klienten, React Query och lagring i telefonen. |
| `src/theme/` | Färger för ljust och mörkt läge, `useTheme()` och avatarerna. |
| `supabase/migrations/` | Databasens tabeller, regler och funktioner (SQL). |
| `docs/` | Designsystem, skärmar, Figma-skript och guider. |
| `assets/images/` | Logga, appikon och splash. |

Den som inte är inloggad kommer bara åt Logga in och Skapa konto. Utan öppnat hushåll skickar dagsvyn vidare till Mina hushåll.

Använd komponenterna och temat i stället för egna färger, så ser appen likadan ut överallt:

```tsx
import { Card, PillButton } from "../components/ui";
import { useTheme } from "../theme/ThemeProvider";

const { colors } = useTheme();
```

## Så jobbar vi

- Varje uppgift är en [issue](https://github.com/MicOli96/Household/issues) med etikett för område (`område 1`–`område 6`) och krav (`G` eller `VG`).
- Gör en gren per issue från `main`.
- Gör små commits med beskrivande meddelanden.
- Öppna en PR mot `main` och skriv `Closes #nummer` i beskrivningen. Någon annan i gruppen granskar och mergar.
- CI måste vara grön innan PR:en mergas.

| Område | Innehåll |
|---|---|
| 1. Grund & Design | Logga, ikon, splash, design, tema, backend, CI |
| 2. Konto & Profil | Registrera, logga in, namn, avatar, gå med i och lämna hushåll |
| 3. Hushåll | Namn och kod, medlemmar, förfrågningar, ägare, pausa, byta hushåll |
| 4. Sysslor | Skapa, redigera, ta bort och arkivera sysslor, bild och ljud |
| 5. Dagsvy & Schemaläggning | Dagsvy, markera som gjord, tilldela och rotera sysslor |
| 6. Statistik | Fördelning, vikter, vecko- och månadsvyer |

## Krav

✅ klar · 🟡 delvis klar · ⬜ inte påbörjad. Krav med \* är obligatoriska för G. VG kräver 32 av 40 krav och CI.

**39 av 40 krav är klara.** Det som saknas är att lämna ett hushåll (#26).

### Kravlista
| | Krav | Issue |
|---|---|---|
| ✅ | En logga, splashscreen och appikon ska designas och användas. \* | #3, #4, #79 |
| ✅ | Applikationen ska byggas med RN, Expo & TS. \* | #5 |
| ✅ | Designen av appen ska utgå ifrån befintliga skisser. \* | #1, #2, #9, #77 |
| ✅ | Information ska kommuniceras till och från en server. | #6, #90 |

### Hushåll
| | Krav | Issue |
|---|---|---|
| ✅ | Ett hushåll ska ha ett namn och en genererad (enkel) kod så andra kan gå med, namnet ska gå att ändra. \* | #15 |
| ✅ | Alla användare i ett hushåll ska kunna se vilka som tillhör hushållet. | #16 |
| ✅ | En ägare ska kunna se förfrågningar om att gå med i hushållet. | #17 |
| ✅ | En ägare ska kunna acceptera eller neka förfrågningar. | #18 |
| ✅ | En ägare ska kunna göra andra till ägare. | #19 |
| ✅ | En ägare ska kunna pausa en användare, och pausade perioder tas inte med i statistiken. | #20 |
| ✅ | Om en användare har pausats under en del av en period ska graferna normaliseras. | #21 |

### Konto
| | Krav | Issue |
|---|---|---|
| ✅ | En användare ska kunna registrera och logga in sig. \* | #22, #72, #74 |
| ✅ | En användare ska kunna skapa ett nytt hushåll. \* | #23 |
| ✅ | En användare ska kunna gå med i ett hushåll genom att ange hushållets kod. \* | #24 |
| ✅ | En ägare behöver godkänna användaren innan den går med i hushållet. | #25 |
| ⬜ | En användare ska kunna lämna ett hushåll. | #26 |

### Profil
| | Krav | Issue |
|---|---|---|
| ✅ | En användare ska kunna ange sitt namn. \* | #27 |
| ✅ | En användare ska kunna välja en avatar (emoji-djur + färg) från en fördefinierad lista. \* | #29 |
| ✅ | Valda avatarer ska inte kunna väljas av andra användare i hushållet. \* | #30 |
| ✅ | Avataren ska användas i appen för att visa vad användaren har gjort. \* | #32 |
| ✅ | En användare ska kunna ställa in appens utseende (mörkt, ljust, auto). | #7 |
| ✅ | En användare som tillhör flera hushåll ska kunna byta mellan dem. | #38 |

### Sysslor
| | Krav | Issue |
|---|---|---|
| ✅ | En ägare ska kunna lägga till sysslor att göra i hemmet. \* | #28 |
| ✅ | En syssla ska ha ett namn, en beskrivning, hur ofta den ska göras (dagar) och en vikt. \* | #31 |
| ✅ | En användare ska kunna lägga till en ljudinspelning och en bild till sysslan. | #33 |
| ✅ | En ägare ska kunna redigera en syssla. \* | #34 |
| ✅ | En ägare ska kunna ta bort en syssla. | #35 |
| ✅ | Vid borttagning ska användaren varnas om att statistiken försvinner och kunna arkivera i stället. | #37 |

### Dagsvyn
| | Krav | Issue |
|---|---|---|
| ✅ | Alla sysslor ska listas i en dagsvy och ge en översikt kring vad som behöver göras. \* | #10, #12 |
| ✅ | Dagsvyn ska visa vem som har gjort sysslan, hur många dagar sedan den gjordes och om den är försenad. \* | #10, #12 |
| ✅ | När en användare väljer en syssla ska beskrivningen visas och sysslan kunna markeras som gjord med ett tryck. \* | #11 |

### Statistik
| | Krav | Issue |
|---|---|---|
| ✅ | En användare ska kunna se fördelningen av gjorda sysslor mellan användarna i hushållet. \* | #39 |
| ✅ | Varje statistikvy ska visa den totala fördelningen (med vikter) och fördelningen per syssla. \* | #40 |
| ✅ | Det ska finnas en statistikvy över "nuvarande vecka". \* | #41 |
| ✅ | Det ska finnas en statistikvy över "förra veckan". | #42 |
| ✅ | Det ska finnas en statistikvy över "förra månaden". | #43 |
| ✅ | Om det inte finns statistik för en vy ska den vyn inte visas. | #44 |

### Schemaläggning
| | Krav | Issue |
|---|---|---|
| ✅ | En ägare ska kunna tilldela och ta bort sysslor från användare i hushållet. | #13 |
| ✅ | Användare ska kunna se de tilldelade sysslorna i sitt gränssnitt. | #13 |
| ✅ | En ägare ska kunna skapa grupper av sysslor som roteras automatiskt mellan användarna. | #14 |

### Övrigt
| | Krav | Issue |
|---|---|---|
| ✅ | Git och GitHub används. | |
| ✅ | CI med GitHub Actions kör typkontroll och lint på varje PR. (VG) | #8 |

## Kvar att göra

| Issue | Vad | Läge |
|---|---|---|
| #26 | Lämna ett hushåll | Inte påbörjad. Hushållsvyn visar en platshållare för knappen. |
| #104 | Flikar längst ner för Hushåll, Sysslor och Statistik | Inte påbörjad. Appen navigerar i dag med en stack och knappar. |
| #105 | Länk till rotationsgrupper från hushållsvyn för ägare | Inte påbörjad. Rotationsgrupperna finns men nås från Inställningar och från tilldelningen av en syssla. |
| #106 | Öppna profilen från en ikon uppe till höger, kopplad till aktivt hushåll | Inte påbörjad. |
| #107 | Inställningar med bara utseende och logga ut, nåbar från alla sidor | Inte påbörjad. |
| #108 | Ange namn när man skapar eller går med i ett hushåll | Inte påbörjad. Namnet anges i dag i profilen efteråt. |

Issue #30 och #37 står fortfarande som öppna på GitHub men är byggda och mergade (#103), så de kan stängas.

## Fler guider

- [Dagsvyn](docs/dagsvy-guide.md)
- [Avatarer vid utförda sysslor (#32)](docs/issue-32-avatarer.md)
- [Design och Figma](docs/design/README.md)
