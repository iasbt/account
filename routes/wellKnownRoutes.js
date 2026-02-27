
import express from "express";
import { getJwks, getOpenIdConfiguration } from "../controllers/wellKnownController.js";

const router = express.Router();

router.get("/jwks.json", getJwks);
router.get("/openid-configuration", getOpenIdConfiguration);

export default router;
