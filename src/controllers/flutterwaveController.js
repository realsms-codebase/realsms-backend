const axios = require("axios");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;

// =============================
// Initialize Payment
// =============================
exports.initializePayment = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 1000) {
      return res.status(400).json({ message: "Minimum deposit is ₦1,000" });
    }

    const tx_ref = "FLW_" + Date.now() + "_" + req.user._id;

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref,
        amount,
        currency: "NGN",
        redirect_url: `${BACKEND_URL}/api/flutterwave/verify`,
        customer: {
          email: req.user.email,
          name: req.user.name,
        },
        customizations: {
          title: "Wallet Funding",
          description: "Fund Wallet",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    await Transaction.create({
      user: req.user._id,
      reference: tx_ref,
      amount,
      currency: "NGN",
      provider: "FLUTTERWAVE",
      status: "PENDING",
    });

    res.json({
      paymentUrl: response.data.data.link,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};

// =============================
// Verify Payment
// =============================
exports.verifyPayment = async (req, res) => {
  try {
    const { transaction_id, tx_ref, status } = req.query;

    if (!transaction_id || !tx_ref) {
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    const transaction = await Transaction.findOne({ reference: tx_ref });

    if (!transaction) {
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    if (transaction.status === "SUCCESS") {
      return res.redirect(`${FRONTEND_URL}/fund-success`);
    }

    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      }
    );

    const paymentData = response.data.data;

    // Extra security checks
    if (
      paymentData.status !== "successful" ||
      paymentData.amount !== transaction.amount ||
      paymentData.currency !== "NGN"
    ) {
      transaction.status = "FAILED";
      await transaction.save();
      return res.redirect(`${FRONTEND_URL}/fund-cancel`);
    }

    const user = await User.findById(transaction.user);

    user.walletBalanceNGN += transaction.amount;
    await user.save();

    transaction.status = "SUCCESS";
    await transaction.save();

    res.redirect(`${FRONTEND_URL}/fund-success`);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}/fund-cancel`);
  }
};
