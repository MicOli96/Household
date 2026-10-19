// Telefonen har inget localStorage, så expo-sqlite lägger till ett som sparar i telefonen.
// Webben använder webbläsarens eget localStorage, se localStorage.ts.
import "expo-sqlite/localStorage/install";
