const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({

    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'account',
        required: [true, 'Account reference is required for creating a ledger entry'],
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required for creating a ledger entry'],
        min: [0.01, 'Amount must be at least 0.01'],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'transaction',
        required: [true, 'Transaction reference is required for creating a ledger entry'],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: ['DEBIT', 'CREDIT'],
            message: 'Type must be either DEBIT or CREDIT'
        },
        required: [true, 'Type is required for creating a ledger entry'],
        immutable: true
    }


});

function preventLedgerModification() { 
    throw new Error('Ledger entries are immutable and cannot be modified or deleted once created');
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('findOneAndRemove', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);

const ledgerModel = mongoose.model('ledger', ledgerSchema);

module.exports = ledgerModel;