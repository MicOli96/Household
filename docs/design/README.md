# Designsystemet in i Figma (issue #1)

`designsystem.svg` innehåller allt i issue #1, i både ljust och mörkt läge: färger, textstilar, sysslekort, brickor, knappar, avatarer och textfält. Måtten och färgerna är desamma som i koden (`src/theme/colors.ts`, `ChoreCard`).

## 1. Dra in filen
Öppna gruppens Figma-fil och dra `designsystem.svg` rakt in på ytan. Allt kommer in som redigerbara former och text, uppdelat i lager med namn som `component/ChoreCard`.

## 2. Gör färgerna till styles
För varje färgruta under FÄRGER: markera rutan, klicka på de fyra prickarna vid **Fill** i högerpanelen och välj **+** för att skapa en style. Döp den till `light/primary`, `dark/primary` och så vidare (namnet står under rutan).

## 3. Gör texterna till textstyles
Markera "Rubrik 22 / Semibold", klicka på de fyra prickarna vid **Text** och skapa en style som heter `Rubrik`. Gör likadant för Korttitel, Brödtext och Liten.

## 4. Gör komponenter
Markera ett sysslekort (hela gruppen) och tryck `Ctrl+Alt+K`. Gör likadant för en bricka, en knapp, en avatar och textfältet. Byt typsnitt till Inter om något ser konstigt ut.

## 5. Bocka av
Bocka av punkterna i issue #1 på GitHub . "Skisserna inkopierade" kan du bocka av när lärarens skisser också ligger i filen.
