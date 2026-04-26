import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import debtsRouter from "./debts";
import summaryRouter from "./summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(debtsRouter);
router.use(summaryRouter);

export default router;
