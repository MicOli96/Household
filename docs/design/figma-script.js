// Körs i Figma-pluginet "Scripter" för att sätta upp designsystemet (issue #1).
// Skapar färg- och textstilar och gör om alla lager som heter "component/..."
// till Figma-komponenter. Färgerna är samma som i src/theme/colors.ts.
// Kan köras flera gånger: stilar som redan finns hoppas över.

const colors = {
  light: {
    background: "#F2F2F2",
    card: "#FFFFFF",
    text: "#222222",
    textMuted: "#8A8A8A",
    primary: "#FF8A4C",
    danger: "#D15C6E",
    accent: "#FFD53D",
    border: "#E0E0E0",
  },
  dark: {
    background: "#121212",
    card: "#1E1E1E",
    text: "#F2F2F2",
    textMuted: "#A0A0A0",
    primary: "#FF9A62",
    danger: "#E06B7D",
    accent: "#FFD53D",
    border: "#2C2C2C",
  },
}

const textStyles = [
  { name: "Rubrik", size: 22, style: "Semi Bold" },
  { name: "Korttitel", size: 17, style: "Semi Bold" },
  { name: "Brödtext", size: 16, style: "Regular" },
  { name: "Liten", size: 13, style: "Regular" },
]

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 }
}

// Färgstilar
const existingPaints = (await figma.getLocalPaintStylesAsync()).map((s) => s.name)
let paintCount = 0
for (const [mode, palette] of Object.entries(colors)) {
  for (const [key, hex] of Object.entries(palette)) {
    const name = `${mode}/${key}`
    if (existingPaints.includes(name)) continue
    const style = figma.createPaintStyle()
    style.name = name
    style.paints = [{ type: "SOLID", color: hexToRgb(hex) }]
    paintCount++
  }
}

// Textstilar
const existingTexts = (await figma.getLocalTextStylesAsync()).map((s) => s.name)
let textCount = 0
for (const t of textStyles) {
  if (existingTexts.includes(t.name)) continue
  const fontName = { family: "Inter", style: t.style }
  await figma.loadFontAsync(fontName)
  const style = figma.createTextStyle()
  style.name = t.name
  style.fontName = fontName
  style.fontSize = t.size
  textCount++
}

// Komponenter: bara första förekomsten av varje namn, i ljusa halvan
// Namn på komponenter som redan finns, så att en ny körning inte skapar dubbletter
const seen = new Set(
  figma.currentPage
    .findAll((n) => n.type === "COMPONENT")
    .map((n) => `component/${n.name}`),
)
let componentCount = 0
const candidates = figma.currentPage.findAll(
  (n) => n.name.startsWith("component/") && n.type !== "COMPONENT" && n.type !== "INSTANCE",
)
for (const node of candidates) {
  // Hoppa över lager som försvunnit när en tidigare komponent skapades
  if (node.removed) continue
  // Läs namnet innan lagret görs om, efteråt finns det gamla lagret inte kvar
  const original = node.name
  const isAvatar = original.startsWith("component/Avatar/")
  const key = isAvatar ? original : original.replace(/\/\d+$/, "")
  if (seen.has(key)) continue
  seen.add(key)
  const component = figma.createComponentFromNode(node)
  component.name = isAvatar ? `Avatar/${original.split("/").pop()}` : key.replace("component/", "")
  componentCount++
}

figma.notify(
  `Klart: ${paintCount} färgstilar, ${textCount} textstilar, ${componentCount} komponenter`,
)
