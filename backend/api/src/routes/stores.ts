import { Router } from "express";
import { authenticateUser } from "../middleware/auth";
import { validatePagination } from "../middleware/validation";
import { storeController as StoreController } from "../controllers/storeController";

const router: Router = Router();

// Public — anyone can browse stores
router.get("/", validatePagination, StoreController.getAllStores);
router.post("/", authenticateUser, StoreController.createStoreRequest);

// /me MUST be before /:id — Express matches routes in registration order
router.get("/me", authenticateUser, StoreController.getMyStore);

// Param routes last
router.get("/:id", StoreController.getStoreById);
router.put("/:id", authenticateUser, StoreController.updateStore);
router.delete("/:id", authenticateUser, StoreController.deleteStore);

export default router;
