import { body } from "express-validator";

export const reglasObjetivo = [
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio."),
  body("meta")
    .notEmpty().withMessage("La meta es obligatoria.")
    .isFloat({ min: 0 }).withMessage("La meta debe ser un número positivo."),
  body("acumulado")
    .notEmpty().withMessage("El acumulado es obligatorio.")
    .isFloat({ min: 0 }).withMessage("El acumulado debe ser un número positivo.")
];
