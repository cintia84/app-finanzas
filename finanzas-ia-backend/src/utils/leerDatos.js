import { readFile } from "fs/promises";

// Todos los controllers necesitan lo mismo: leer el JSON y parsearlo.
// En vez de repetir estas dos líneas en cada archivo, las ponemos acá una sola vez.
export async function leerDatos() {
  const contenido = await readFile("./src/data/finanzas.json", "utf-8");
  return JSON.parse(contenido);
}
