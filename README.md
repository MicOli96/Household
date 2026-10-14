# Hushållet

En app för familjer, sambos och släktingar som delar på sysslorna i hemmet. Man skapar eller går med i ett hushåll med en kod, väljer en djuravatar och ser i en dagsvy vilka sysslor som behöver göras och vilka som är försenade. Man markerar sysslor som gjorda och ser statistik över vem som har gjort mest, viktat efter hur jobbiga sysslorna är.

Byggd med React Native, Expo och TypeScript som inlämning 2 i kursen. Produktägare: David Jensen.

## Kom igång

Du behöver [Node.js](https://nodejs.org) (version 22) och appen [Expo Go](https://expo.dev/go) på mobilen.

```bash
git clone https://github.com/MicOli96/Household.git
cd Household
npm install
npx expo start
```

Skanna QR-koden med kameran (iPhone) eller i Expo Go (Android). Tryck `w` i terminalen för att öppna appen i webbläsaren i stället.

### Backend (Supabase)

Appen använder [Supabase](https://supabase.com) som backend: databas, inloggning och filer. Kopiera `.env.example` till `.env.local` och fyll i projektets adress och publishable key (Supabase → Project Settings → API Keys). `.env.local` checkas inte in.

Databasen beskrivs av filerna i `supabase/migrations/`. Ändra inte tabeller direkt i Supabase, lägg till en ny migration i stället så att alla har samma databas. Så här kopplar du terminalen till projektet och skickar upp migrationerna:

```bash
npx supabase login
npx supabase link --project-ref <projekt-id>
npx supabase db push
```

### Kontroller

Samma kontroller körs automatiskt i GitHub Actions på varje PR mot `main`. Kör dem gärna själv innan du pushar:

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
```

## Projektstruktur

| Mapp | Innehåll |
|---|---|
| `src/app/` | Skärmar. Varje fil är en route (Expo Router), `_layout.tsx` styr navigeringen. |
| `src/components/ui/` | Gemensamma komponenter: `PillButton`, `Card`, `Badge`, `Avatar`, `TextField`, `AppModal`, `ConfirmDialog`, `CheckRow`, `SegmentedControl`. |
| `src/components/` | Komponenter för en viss vy, t.ex. `ChoreCard`. |
| `src/theme/` | Färger för ljust och mörkt läge, `useTheme()` och avatarerna. |
| `src/utils/` | Uträkningar, t.ex. om en syssla är försenad och vem som har en rotationsgrupp (`rotation.ts`). |
| `src/lib/` | Supabase-klienten (`supabase.ts`). |
| `src/data/` | Typer som följer tabellerna i Supabase (`types.ts`), testdata (`mockData.ts`) och `HouseholdData` med hooks som `useChores()`. Skärmarna läser data via hooksen, så testdatan kan bytas mot Supabase utan att skärmarna ändras. |
| `supabase/migrations/` | Databasens tabeller, regler och funktioner (SQL). |
| `docs/design/` | Designsystem, skärmar och Figma-skript. |
| `assets/images/` | Logga, appikon och splash. |

Använd komponenterna och temat i stället för egna färger, så ser appen likadan ut överallt:

```tsx
import { Card, PillButton } from "../components/ui";
import { useTheme } from "../theme/ThemeProvider";

const { colors } = useTheme();
```

Alla komponenter visas i appen under **Ändra → Visa komponenter**.

## Så jobbar vi

- Varje uppgift är en [issue](https://github.com/MicOli96/Household/issues) med etikett för område (`område 1`–`område 6`) och krav (`G` eller `VG`).
- Gör en gren per issue från `main`, t.ex. `namn/kort-beskrivning`.
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

## Klart hittills

Mergat till `main`:

- Logga, appikon, splash, tema (ljust, mörkt, auto, sparas mellan starter) och gemensamma UI-komponenter (#36, #55).
- CI med typkontroll och lint på varje PR (#45).
- Supabase som backend med tabeller, regler och tidsstämplar på alla tabeller (#48, #51).
- Skärmskelett och navigering för alla delar av appen (#47, #49).
- Dagsvy, tilldelning av sysslor och rotationsgrupper med testdata (#50).

Statistik (#39–#41) ligger i PR #56.

## Krav

✅ klar · 🟡 påbörjad · ⬜ inte påbörjad. Krav med \* är obligatoriska för G. VG kräver 32 av 40 krav och CI.

### Kravlista
| | Krav | Issue |
|---|---|---|
| ✅ | En logga, splashscreen och appikon ska designas och användas. \* | #3, #4 |
| ✅ | Applikationen ska byggas med RN, Expo & TS. \* | #5 |
| 🟡 | Designen av appen ska utgå ifrån befintliga skisser. \* | #1, #2, #9 |
| ✅ | Information ska kommuniceras till och från en server. | #6 |

### Hushåll
| | Krav | Issue |
|---|---|---|
| ⬜ | Ett hushåll ska ha ett namn och en genererad (enkel) kod så andra kan gå med, namnet ska gå att ändra. \* | #15 |
| ⬜ | Alla användare i ett hushåll ska kunna se vilka som tillhör hushållet. | #16 |
| ⬜ | En ägare ska kunna se förfrågningar om att gå med i hushållet. | #17 |
| ⬜ | En ägare ska kunna acceptera eller neka förfrågningar. | #18 |
| ⬜ | En ägare ska kunna göra andra till ägare. | #19 |
| ⬜ | En ägare ska kunna pausa en användare, och pausade perioder tas inte med i statistiken. | #20 |
| ⬜ | Om en användare har pausats under en del av en period ska graferna normaliseras. | #21 |

### Konto
| | Krav | Issue |
|---|---|---|
| ⬜ | En användare ska kunna registrera och logga in sig. \* | #22 |
| ⬜ | En användare ska kunna skapa ett nytt hushåll. \* | #23 |
| ⬜ | En användare ska kunna gå med i ett hushåll genom att ange hushållets kod. \* | #24 |
| ⬜ | En ägare behöver godkänna användaren innan den går med i hushållet. | #25 |
| ⬜ | En användare ska kunna lämna ett hushåll. | #26 |

### Profil
| | Krav | Issue |
|---|---|---|
| ⬜ | En användare ska kunna ange sitt namn. \* | #27 |
| ⬜ | En användare ska kunna välja en avatar (emoji-djur + färg) från en fördefinierad lista. \* | #29 |
| ⬜ | Valda avatarer ska inte kunna väljas av andra användare i hushållet. \* | #30 |
| 🟡 | Avataren ska användas i appen för att visa vad användaren har gjort. \* | #32 |
| ✅ | En användare ska kunna ställa in appens utseende (mörkt, ljust, auto). | #7 |
| ⬜ | En användare som tillhör flera hushåll ska kunna byta mellan dem. | #38 |

### Sysslor
| | Krav | Issue |
|---|---|---|
| ⬜ | En ägare ska kunna lägga till sysslor att göra i hemmet. \* | #28 |
| ⬜ | En syssla ska ha ett namn, en beskrivning, hur ofta den ska göras (dagar) och en vikt. \* | #31 |
| ⬜ | En användare ska kunna lägga till en ljudinspelning och en bild till sysslan. | #33 |
| ⬜ | En ägare ska kunna redigera en syssla. \* | #34 |
| ⬜ | En ägare ska kunna ta bort en syssla. | #35 |
| ⬜ | Vid borttagning ska användaren varnas om att statistiken försvinner och kunna arkivera i stället. | #37 |

### Dagsvyn
| | Krav | Issue |
|---|---|---|
| 🟡 | Alla sysslor ska listas i en dagsvy och ge en översikt kring vad som behöver göras. \* | #10, #12 |
| 🟡 | Dagsvyn ska visa vem som har gjort sysslan, hur många dagar sedan den gjordes och om den är försenad. \* | #10, #12 |
| 🟡 | När en användare väljer en syssla ska beskrivningen visas och sysslan kunna markeras som gjord med ett tryck. \* | #11 |

### Statistik
| | Krav | Issue |
|---|---|---|
| ⬜ | En användare ska kunna se fördelningen av gjorda sysslor mellan användarna i hushållet. \* | #39 |
| ⬜ | Varje statistikvy ska visa den totala fördelningen (med vikter) och fördelningen per syssla. \* | #40 |
| ⬜ | Det ska finnas en statistikvy över "nuvarande vecka". \* | #41 |
| ⬜ | Det ska finnas en statistikvy över "förra veckan". | #42 |
| ⬜ | Det ska finnas en statistikvy över "förra månaden". | #43 |
| ⬜ | Om det inte finns statistik för en vy ska den vyn inte visas. | #44 |

### Schemaläggning
| | Krav | Issue |
|---|---|---|
| ✅ | En ägare ska kunna tilldela och ta bort sysslor från användare i hushållet. | #13 |
| ✅ | Användare ska kunna se de tilldelade sysslorna i sitt gränssnitt. | #13 |
| ✅ | En ägare ska kunna skapa grupper av sysslor som roteras automatiskt mellan användarna. | #14 |

### Övrigt
| | Krav |
|---|---|
| ✅ | Git och GitHub används. |
| ✅ | CI med GitHub Actions kör typkontroll och lint på varje PR. (VG) |
