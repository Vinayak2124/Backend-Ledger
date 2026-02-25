const accountModel = require("../models/account.model");

async function createAccountController(req, res) {
  const user = req.user;

  const account = await accountModel.create({
    user: user._id,
  });

  res.status(201).json({
    message: "Account created successfully",
    account: account,
  });
}

async function getUserAccountsController(req, res) {
    const accounts = await accountModel.find({ user: req.user._id });
    res.status(200).json({
        message: "User accounts retrieved successfully",
        accounts: accounts,
    });
}

async function getAccountBalanceController(req, res) {
    const accountId = req.params.accountId;
    const account = await accountModel.findOne({ _id: accountId, user: req.user._id });

    if(!account) {
        return res.status(404).json({
            message: "Account not found",
        });
    }
    const balance = await account.getBalance();
    res.status(200).json({  
        message: "Account balance retrieved successfully",
        balance: balance,
        accountId: account._id
    });

}
module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
};
