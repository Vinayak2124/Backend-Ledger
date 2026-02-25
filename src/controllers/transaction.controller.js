const { authMiddleware } = require("../middleware/auth.middleware");
const transactionModel = require("../models/transaction.model");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose");
const legderModel = require("../models/ledger.model");
const userModel = require("../models/user.model");
const {
  sendTransactionEmail,
  recieveFundTransactionEmail,
} = require("../services/email.service");
async function createTransactionController(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message:
        "Missing required fields: fromAccount, toAccount, amount, idempotencyKey",
    });
  }
  const fromUserAccount = await accountModel.findOne({ _id: fromAccount });
  const fromUser = await userModel.findOne({ _id: fromUserAccount.user });
  if (!fromUserAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or user does not own the fromAccount",
    });
  }
  const toUserAccount = await accountModel.findOne({ _id: toAccount });
  const toUser = await userModel.findOne({ _id: toUserAccount.user });
  if (!toUserAccount) {
    return res.status(400).json({
      message: "Invalid toAccount or user does not own the toAccount",
    });
  }

  // validate the idempotency key

  const isTransactionExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });
  if (isTransactionExists) {
    if (isTransactionExists.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already completed with the same idempotency key",
      });
    }
    if (isTransactionExists.status === "PENDING") {
      return res.status(200).json({
        message:
          "Transaction is already in progress with the same idempotency key",
      });
    }
    if (isTransactionExists.status === "FAILED") {
      return res.status(409).json({
        message:
          "A transaction with the same idempotency key failed previously. Please use a different idempotency key.",
      });
    }
    if (isTransactionExists.status === "REVERSED") {
      return res.status(409).json({
        message:
          "A transaction with the same idempotency key was reversed previously. Please try again later or use a different idempotency key.",
      });
    }
  }

  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message: "Both accounts must be active",
    });
  }

  const fromAccountBalance = await fromUserAccount.getBalance();
  if (fromAccountBalance < amount) {
    return res.status(400).json({
      message: `Insufficient balance in fromAccount. Current balance: ${fromAccountBalance}, Requested amount: ${amount}`,
    });
  }

  const toAccountBalance = await toUserAccount.getBalance();

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = (
    await transactionModel.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING",
        },
      ],
      { session },
    )
  )[0];

  const creditLedgerEntry = await legderModel.create(
    [
      {
        account: toAccount,
        type: "CREDIT",
        amount: amount,
        transaction: transaction._id,
      },
    ],
    { session },
  );
  const debitLedgerEntry = await legderModel.create(
    [
      {
        account: fromAccount,
        type: "DEBIT",
        amount: amount,
        transaction: transaction._id,
      },
    ],
    { session },
  );

  await transactionModel.findOneAndUpdate(
    { _id: transaction._id },
    { status: "COMPLETED" },
    { session, new: true },
  );
  await session.commitTransaction();
  session.endSession();

  await sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);
  await recieveFundTransactionEmail(
    toUser.email,
    toUser.name,
    amount,
    fromUser.email,
  );
  return res.status(201).json({
    message: "Transaction completed successfully",
    transaction: transaction,
  });
}

async function createInitalfundingTransactionController(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "Missing required fields: toAccount, amount, idempotencyKey",
    });
  }

  const toUserAccount = await accountModel.findOne({ _id: toAccount });
  const touser = await userModel.findOne({ _id: toUserAccount.user });
  if (!toUserAccount) {
    return res.status(400).json({
      message: "Invalid toAccount or user does not own the toAccount",
    });
  }

  const fromUserAccount = await accountModel.findOne({ user: req.user._id });
  const isSystemUser = req.user.systemUser;
  if (!isSystemUser) {
    return res.status(403).json({
      message: "Only system users can perform initial funding transactions",
    });
  }
  if (!fromUserAccount) {
    return res.status(400).json({
      message: "System account not found for the user",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = new transactionModel({
      fromAccount: fromUserAccount._id,
      toAccount,
      amount,
      idempotencyKey,
      status: "PENDING",
    });

    await transaction.save({ session });

    await legderModel.create(
      [
        {
          account: toAccount,
          type: "CREDIT",
          amount,
          transaction: transaction._id,
        },
      ],
      { session },
    );

    await legderModel.create(
      [
        {
          account: fromUserAccount._id,
          type: "DEBIT",
          amount,
          transaction: transaction._id,
        },
      ],
      { session },
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    // ✅ Anything here MUST NOT affect DB
    await recieveFundTransactionEmail(
      touser.email,
      touser.name,
      amount,
      req.user.email,
    );

    return res.status(201).json({
      message: "Initial funding transaction completed successfully",
      transaction,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    session.endSession();

    console.error(error);

    return res.status(500).json({
      message: "Transaction failed",
      error: error.message,
    });
  }
}
module.exports = {
  createTransactionController,
  createInitalfundingTransactionController,
};
