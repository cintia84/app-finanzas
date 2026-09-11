import { Router } from "express";
import {
  obtenerCuentas,
  crearCuenta,
  actualizarCuenta,
  eliminarCuenta
} from "../controllers/cuentas.controller.js";
import { reglasCuenta } from "../validators/cuenta.validator.js";
import { manejarErroresValidacion } from "../middlewares/validacion.middleware.js";

const router = Router();

router.get("/", obtenerCuentas);
router.post("/", reglasCuenta, manejarErroresValidacion, crearCuenta);
router.put("/:id", reglasCuenta, manejarErroresValidacion, actualizarCuenta);
router.delete("/:id", eliminarCuenta);

export default router;
