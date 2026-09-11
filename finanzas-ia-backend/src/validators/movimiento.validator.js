import { body } from "express-validator";

export const reglasMovimiento = [
  body("fecha")
    .notEmpty().withMessage("La fecha es obligatoria.")
    .isISO8601().withMessage("La fecha debe tener formato AAAA-MM-DD."),
  body("comercio")
    .trim()
    .notEmpty().withMessage("El comercio es obligatorio."),
  body("categoria")
    .trim()
    .notEmpty().withMessage("La categoría es obligatoria."),
  body("cuenta")
    .trim()
    .notEmpty().withMessage("La cuenta es obligatoria."),
  body("importe")
    .notEmpty().withMessage("El importe es obligatorio.")
    .isNumeric().withMessage("El importe debe ser un número."),
  // Estos dos son opcionales: si vienen, deben ser texto; si no vienen, no pasa nada
  body("subcategoria").optional({ values: "falsy" }).isString(),
  body("medio").optional({ values: "falsy" }).isString()
];
