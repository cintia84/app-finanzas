import { body } from "express-validator";

export const reglasRegistro = [
  body("usuario")
    .trim()
    .notEmpty().withMessage("El usuario es obligatorio.")
    .isLength({ min: 3 }).withMessage("El usuario debe tener al menos 3 caracteres."),
  body("password")
    .notEmpty().withMessage("La contraseña es obligatoria.")
    .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres.")
];

export const reglasLogin = [
  body("usuario").trim().notEmpty().withMessage("El usuario es obligatorio."),
  body("password").notEmpty().withMessage("La contraseña es obligatoria.")
];
