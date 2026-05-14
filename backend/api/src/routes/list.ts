import { Router } from "express";
import { ListController } from "../controllers/listController";
import { authenticateUser } from "../middleware/auth";

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateUser);

// Rutas de listas
router.get("/", ListController.getUserLists);
router.post("/", ListController.createList);
router.get("/:id", ListController.getListById);
router.put("/:id", ListController.updateList);
router.delete("/:id", ListController.deleteList);

// Routes for rackets in lists
router.post("/:id/rackets", ListController.addRacketToList);
router.delete("/:id/rackets/:racketId", ListController.removeRacketFromList);

export default router;
