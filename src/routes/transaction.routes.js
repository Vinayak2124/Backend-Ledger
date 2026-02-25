const { Router } = require("express");
const { authMiddleware,systemAuthMiddleware } = require("../middleware/auth.middleware");
const { createTransactionController,createInitalfundingTransactionController } = require("../controllers/transaction.controller");
const transactionRoutes = Router();

transactionRoutes.post("/", authMiddleware, createTransactionController); 
transactionRoutes.post("/system/inital-fund", systemAuthMiddleware, createInitalfundingTransactionController);


module.exports = transactionRoutes;