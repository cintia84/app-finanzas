import { validationResult } from "express-validator";

// Este middleware va SIEMPRE después de las reglas de validación
// (los check(...) de cada ruta) y ANTES del controller.
export function manejarErroresValidacion(req, res, next) {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    // .array() devuelve una lista de objetos {msg, path, ...}; nos
    // quedamos solo con el mensaje de cada uno, que es lo que le
    // importa al frontend
    return res.status(400).json({
      error: errores.array()[0].msg,
      detalles: errores.array().map(e => e.msg)
    });
  }

  next(); // todo bien, seguimos al controller
}
