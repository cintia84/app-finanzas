import { Router } from "express";
import {
  obtenerMovimientos,
  crearMovimiento,
  actualizarMovimiento,
  eliminarMovimiento
} from "../controllers/movimientos.controller.js";
import { reglasMovimiento } from "../validators/movimiento.validator.js";
import { manejarErroresValidacion } from "../middlewares/validacion.middleware.js";

const router = Router();

router.get("/", obtenerMovimientos);
router.post("/", reglasMovimiento, manejarErroresValidacion, crearMovimiento);
router.put("/:id", reglasMovimiento, manejarErroresValidacion, actualizarMovimiento);
router.delete("/:id", eliminarMovimiento);

export default router;
