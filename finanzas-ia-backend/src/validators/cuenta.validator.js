import { body } from "express-validator";

export const reglasCuenta = [
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio."),
  body("saldo")
    .notEmpty().withMessage("El saldo es obligatorio.")
    .isNumeric().withMessage("El saldo debe ser un número."),
  body("banco").optional({ values: "falsy" }).isString(),
  body("titular").optional({ values: "falsy" }).isString()
];
