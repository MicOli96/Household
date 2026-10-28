// Appens filer importerar varandra utan filändelse ("./dates"), som Metro
// förstår men inte Node. Den här filen laddas med --import innan testerna
// och provar med .ts när Node inte hittar en relativ import.
import { register } from "node:module";

register(import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND" || !specifier.startsWith(".")) throw error;
    return nextResolve(`${specifier}.ts`, context);
  }
}
