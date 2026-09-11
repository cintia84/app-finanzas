import { Router } from "express";
import {
  obtenerObjetivos,
  crearObjetivo,
  actualizarObjetivo,
  eliminarObjetivo
} from "../controllers/objetivos.controller.js";
import { reglasObjetivo } from "../validators/objetivo.validator.js";
import { manejarErroresValidacion } from "../middlewares/validacion.middleware.js";

const router = Router();

router.get("/", obtenerObjetivos);
router.post("/", reglasObjetivo, manejarErroresValidacion, crearObjetivo);
router.put("/:id", reglasObjetivo, manejarErroresValidacion, actualizarObjetivo);
router.delete("/:id", eliminarObjetivo);

export default router;
