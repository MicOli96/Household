// Körs i Figma-pluginet "Scripter" efter figma-skarmar-script.js (issue #2).
// 1. Lägger lärarens dagsvy ("Sysslor - idag") bakom dialogen "9 Ta bort syssla".
// 2. Kopplar ihop skärmarna som en klickbar prototyp.
// Kan köras flera gånger: kopplingar skrivs över och dagsvyn läggs bara in en gång.

const page = figma.currentPage
const frame = (name) => page.findOne((n) => n.type === "FRAME" && n.name === name)
const dagsvy = page.findOne((n) => n.name === "Sysslor - idag" && n.type !== "TEXT")
const missing = []

// --- 1. Dagsvyn bakom dialogen ---
const dialog = frame("9 Ta bort syssla")
if (dialog && dagsvy && !dialog.findOne((n) => n.name === "Bakgrund: dagsvy")) {
  const screenGroup = dialog.children.find((n) => n.name.startsWith("screen/"))
  // Den grå bakgrundsytan döljer annars dagsvyn
  const background = screenGroup && screenGroup.children[0]
  if (background && background.type === "RECTANGLE" && background.width === 375) background.remove()
  const copy = dagsvy.clone()
  copy.name = "Bakgrund: dagsvy"
  dialog.insertChild(0, copy)
  copy.x = 0
  copy.y = 0
} else if (!dagsvy) {
  missing.push("Sysslor - idag")
}

// --- 2. Prototypkopplingar ---

// Hittar det man trycker på: knappen/kortet runt texten, annars texten själv
function hotspot(screen, label, preferButton = false) {
  const texts = screen.findAll((n) => n.type === "TEXT" && n.characters.includes(label))
  const pick =
    (preferButton && texts.find((t) => t.parent && /^(PillButton|Card)/.test(t.parent.name))) ||
    texts.find((t) => t.parent && /^(PillButton|Card|Member|Request)/.test(t.parent.name)) ||
    texts[0]
  if (!pick) return null
  return pick.parent && /^(PillButton|Card|Member|Request)/.test(pick.parent.name) ? pick.parent : pick
}

let linkCount = 0
async function link(fromName, label, toName, preferButton = false) {
  const from = fromName === "Sysslor - idag" ? dagsvy : frame(fromName)
  const to = toName === "Sysslor - idag" ? dagsvy : frame(toName)
  if (!from || !to) {
    missing.push(`${fromName} → ${toName}`)
    return
  }
  const node = hotspot(from, label, preferButton)
  if (!node) {
    missing.push(`"${label}" på ${fromName}`)
    return
  }
  try {
    await node.setReactionsAsync([
      {
        trigger: { type: "ON_CLICK" },
        actions: [
          {
            type: "NODE",
            destinationId: to.id,
            navigation: "NAVIGATE",
            transition: { type: "SMART_ANIMATE", easing: { type: "EASE_OUT" }, duration: 0.25 },
            preserveScrollPosition: false,
          },
        ],
      },
    ])
    linkCount++
  } catch (e) {
    missing.push(`"${label}" på ${fromName} (${e.message})`)
  }
}

await link("1 Logga in", "Logga in", "3 Välj hushåll", true)
await link("1 Logga in", "Skapa konto", "2 Registrera")
await link("2 Registrera", "Skapa konto", "5 Profil", true)
await link("2 Registrera", "‹", "1 Logga in")
await link("3 Välj hushåll", "Familjen Svensson", "Sysslor - idag")
await link("3 Välj hushåll", "Skapa nytt hushåll", "7 Hushåll")
await link("3 Välj hushåll", "Gå med i hushåll", "4 Väntar på godkännande")
await link("4 Väntar på godkännande", "Tillbaka till mina hushåll", "3 Välj hushåll")
await link("4 Väntar på godkännande", "‹", "3 Välj hushåll")
await link("5 Profil", "Spara", "3 Välj hushåll")
await link("5 Profil", "‹", "2 Registrera")
await link("6 Syssla", "Markera som gjord", "Sysslor - idag")
await link("6 Syssla", "‹", "Sysslor - idag")
await link("7 Hushåll", "‹", "8 Inställningar")
await link("8 Inställningar", "Byt hushåll", "3 Välj hushåll")
await link("8 Inställningar", "Redigera profil", "5 Profil")
await link("8 Inställningar", "Logga ut", "1 Logga in")
await link("8 Inställningar", "‹", "Sysslor - idag")
await link("9 Ta bort syssla", "Arkivera i stället", "Sysslor - idag")
await link("9 Ta bort syssla", "Ta bort ändå", "Sysslor - idag")
await link("9 Ta bort syssla", "Avbryt", "Sysslor - idag")
// Från lärarens dagsvy
await link("Sysslor - idag", "Damma", "6 Syssla")
await link("Sysslor - idag", "Ändra", "8 Inställningar")

// Prototypen startar på inloggningen
const start = frame("1 Logga in")
if (start) {
  try {
    page.flowStartingPoints = [{ nodeId: start.id, name: "Hushållet" }]
  } catch (e) {
    // Inte kritiskt, prototypen går att starta från vilken skärm som helst
  }
}

figma.notify(
  missing.length
    ? `${linkCount} kopplingar klara. Hittade inte: ${missing.join(", ")}`
    : `Klart: ${linkCount} kopplingar. Tryck ▶ Present uppe till höger för att testa.`,
  { timeout: 10000 },
)
