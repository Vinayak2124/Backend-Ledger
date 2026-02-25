const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail(userEmail, subject, text, html) {
  const info = await transporter.sendMail({
    from: `"Banking-Ledger" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject,
    text,
    html,
  });

  console.log("Message sent:", info.messageId);
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
}

async function sendRegistrationEmail(userEmail, name) {
  const subject = "Welcome to Banking-Ledger!";
  const text = `Hi ${name},\n\nThank you for registering with Banking-Ledger. We're excited to have you on board!\n\nBest regards,\nThe Banking-Ledger Team`;
  const html = `<p>Hi ${name},</p><p>Thank you for registering with <strong>Banking-Ledger</strong>. We're excited to have you on board!</p><p>Best regards,<br>The Banking-Ledger Team</p>`;

  await sendMail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction Completed Successfully!";
  const text = `Hi ${name},\n\nYour transaction of INR${amount} to account ${toAccount} was completed successfully.\n\nBest regards,\nThe Banking-Ledger Team`;
  const html = `<p>Hi ${name},</p><p>Your transaction of <strong>INR${amount}</strong> to account <strong>${toAccount}</strong> was completed successfully.</p><p>Best regards,<br>The Banking-Ledger Team</p>`;

  await sendMail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction Failed!";
  const text = `Hi ${name},\n\nUnfortunately, your transaction of INR${amount} to account ${toAccount} failed. Please try again later or contact support for assistance.\n\nBest regards,\nThe Banking-Ledger Team`;
  const html = `<p>Hi ${name},</p><p>Unfortunately, your transaction of <strong>INR${amount}</strong> to account <strong>${toAccount}</strong> failed. Please try again later or contact support for assistance.</p><p>Best regards,<br>The Banking-Ledger Team</p>`;
  await sendMail(userEmail, subject, text, html);
}

async function recieveFundTransactionEmail(
  userEmail,
  name,
  amount,
  fromAccount,
) {
  const subject = "Congratulations! You Received a Transaction!";
  const text = `Hi ${name},\n\nYou have received a transaction of INR${amount} from account ${fromAccount}.\n\nBest regards,\nThe Banking-Ledger Team`;
  const html = `<p>Hi ${name},</p><p>You have received a transaction of <strong>INR${amount}</strong> from account <strong>${fromAccount}</strong>.</p><p>Best regards,<br>The Banking-Ledger Team</p>`;
  await sendMail(userEmail, subject, text, html);
}
module.exports = {
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailureEmail,
  recieveFundTransactionEmail,
};
