const axios = require("axios");
const User = require("../models/User");
const Order = require("../models/Order");

const SMSPOOL_BASE_URL = "https://api.smspool.net";
const API_KEY = process.env.SMS_POOL_API_KEY;

const USD_TO_NGN = 1500;
const MARKUP_PERCENT = 80;
const MARKUP_MULTIPLIER = 1 + MARKUP_PERCENT / 100;

/* =====================================================
   GET ALL COUNTRIES
===================================================== */
const getServers = async (req, res) => {
  try {
    const response = await axios.get(
      `${SMSPOOL_BASE_URL}/country/retrieve_all`,
      { params: { key: API_KEY } }
    );

    const countries = response.data.map((c) => ({
      ID: String(c.ID),
      name: c.name,
      short_name: c.short_name,
    }));

    res.json(countries);
  } catch (err) {
    console.error("Country Error:", err.response?.data || err.message);
    res.status(500).json([]);
  }
};

/* =====================================================
   GET SERVICES WITH MARKUP
===================================================== */
const getServices = async (req, res) => {
  try {
    const [servicesRes, pricingRes] = await Promise.all([
      axios.get(`${SMSPOOL_BASE_URL}/service/retrieve_all`, {
        params: { key: API_KEY },
      }),
      axios.get(`${SMSPOOL_BASE_URL}/request/pricing`, {
        params: { key: API_KEY },
      }),
    ]);

    const services = servicesRes.data.map((service) => {
      const countryPricing = pricingRes.data
        .filter((p) => String(p.service) === String(service.ID))
        .map((p) => {
          const basePriceNGN = Number(p.price) * USD_TO_NGN;
          const priceNGN = basePriceNGN * MARKUP_MULTIPLIER;

          return {
            countryID: String(p.country),
            pool: p.pool,
            basePriceNGN,
            priceNGN,
          };
        });

      return {
        ID: String(service.ID),
        name: service.name,
        pricing: countryPricing,
      };
    });

    res.json(services);
  } catch (err) {
    console.error("Service Error:", err.response?.data || err.message);
    res.status(500).json([]);
  }
};

/* =====================================================
   BUY NUMBER (UPDATED)
===================================================== */
const buyNumber = async (req, res) => {
  const { country, service } = req.body;

  if (!country || !service) {
    return res
      .status(400)
      .json({ success: 0, message: "Country and service are required" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ success: 0, message: "User not found" });

    // Get pricing
    const pricingRes = await axios.get(
      `${SMSPOOL_BASE_URL}/request/pricing`,
      { params: { key: API_KEY } }
    );

    const priceInfo = pricingRes.data.find(
      (p) =>
        String(p.service) === String(service) &&
        String(p.country) === String(country)
    );

    if (!priceInfo)
      return res
        .status(400)
        .json({ success: 0, message: "Service not available for selected country" });

    const basePriceNGN = Number(priceInfo.price) * USD_TO_NGN;
    const sellingPriceNGN = basePriceNGN * MARKUP_MULTIPLIER;

    if (user.walletBalanceNGN < sellingPriceNGN)
      return res
        .status(400)
        .json({ success: 0, message: "Insufficient balance" });

    // Fetch country
    const countryRes = await axios.get(
      `${SMSPOOL_BASE_URL}/country/retrieve_all`,
      { params: { key: API_KEY } }
    );

    const selectedCountry = countryRes.data.find(
      (c) => String(c.ID) === String(country)
    );

    if (!selectedCountry)
      return res
        .status(400)
        .json({ success: 0, message: "Invalid country selected" });

    // ✅ Fetch service name
    const servicesRes = await axios.get(
      `${SMSPOOL_BASE_URL}/service/retrieve_all`,
      { params: { key: API_KEY } }
    );

    const selectedService = servicesRes.data.find(
      (s) => String(s.ID) === String(service)
    );

    if (!selectedService)
      return res
        .status(400)
        .json({ success: 0, message: "Invalid service selected" });

    const purchaseRes = await axios.post(
      `${SMSPOOL_BASE_URL}/purchase/sms`,
      null,
      { params: { key: API_KEY, country, service, quantity: 1 } }
    );

    if (!purchaseRes.data || purchaseRes.data.success === 0) {
      return res.status(500).json({
        success: 0,
        message: purchaseRes.data?.message || "Purchase failed",
      });
    }

    const { number, orderid } = purchaseRes.data;

    // Deduct wallet
    user.walletBalanceNGN -= sellingPriceNGN;
    await user.save();

    // ✅ SAVE SERVICE NAME
    const order = new Order({
      user: user._id,
      service: {
        id: String(service),
        name: selectedService.name,
      },
      country: {
        id: String(country),
        code: selectedCountry.short_name,
      },
      orderid,
      number,
      baseCost: basePriceNGN,
      priceCharged: sellingPriceNGN,
      profit: sellingPriceNGN - basePriceNGN,
      status: "waiting",
    });

    await order.save();

    res.json({
      success: 1,
      message: "Number purchased successfully",
      data: {
        number,
        orderid,
        pricePaid: sellingPriceNGN,
        countryCode: selectedCountry.short_name,
        serviceName: selectedService.name,
      },
      remainingBalance: user.walletBalanceNGN,
    });
  } catch (err) {
    console.error("Buy Error:", err.response?.data || err.message);
    res.status(500).json({ success: 0, message: "Purchase failed" });
  }
};

// /* =====================================================
//    GET OTP
// ===================================================== */
const getOtp = async (req, res) => {
  const { orderid } = req.body;

  if (!orderid) {
    return res.status(400).json({
      success: 0,
      message: "Order ID is required",
    });
  }

  try {
    const order = await Order.findOne({ orderid });

    if (!order) {
      return res.status(404).json({
        success: 0,
        message: "Order not found",
      });
    }

    // ✅ If OTP already received, return immediately
    if (order.status === "received" && order.otp) {
      return res.json({
        success: 1,
        otp: order.otp,
        status: "received",
        message: "OTP already received",
      });
    }

    // Request OTP from SMSPool
    const response = await axios.post(
      `${SMSPOOL_BASE_URL}/sms/check`,
      null,
      {
        params: {
          key: API_KEY,
          orderid,
        },
      }
    );

    const status = Number(response.data.status);
    const sms = response.data.sms;

    // ✅ OTP received
    if (status === 3 && sms) {
      const otp = sms.match(/\d{4,6}/)?.[0];

      if (otp) {
        order.otp = otp;
        order.status = "received";
        await order.save();

        return res.json({
          success: 1,
          otp,
          status: "received",
          message: "OTP received successfully",
        });
      }
    }

    // ❌ Order expired
    if (status === 4) {
      order.status = "cancelled";
      await order.save();

      return res.json({
        success: 0,
        status: "cancelled",
        message: "Order expired or cancelled",
      });
    }

    // ⏳ Still waiting
    return res.json({
      success: 0,
      status: "waiting",
      message: "OTP not yet available",
    });

  } catch (err) {
    console.error("OTP Error:", err.response?.data || err.message);

    res.status(500).json({
      success: 0,
      message: "Failed to check OTP",
    });
  }
};

/* =====================================================
   RESEND OTP
===================================================== */
// const resendOtp = async (req, res) => {
//   const { orderid } = req.body;
//   if (!orderid) return res.status(400).json({ success: 0, message: "Order ID is required" });

//   try {
//     const order = await Order.findOne({ orderid, user: req.user.id });
//     if (!order) return res.status(404).json({ success: 0, message: "Order not found" });

//     if (order.status === "refunded" || order.status === "cancelled") {
//       return res.status(400).json({ success: 0, message: "Cannot resend OTP for refunded or cancelled orders" });
//     }

//     const response = await axios.post(`${SMSPOOL_BASE_URL}/sms/resend`, null, { params: { key: API_KEY, orderid } });
//     if (response.data.success === 1) {
//       order.resendRequested = true; // track resend request
//       await order.save();
//       return res.json({ success: 1, message: "OTP resent successfully" });
//     } else {
//       return res.status(500).json({ success: 0, message: response.data?.message || "Failed to resend OTP" });
//     }

//   } catch (err) {
//     console.error("Resend OTP Error:", err.response?.data || err.message);
//     res.status(500).json({ success: 0, message: "Failed to resend OTP" });
//   }
// };

const resendOtp = async (req, res) => {
  const { orderid } = req.body;

  if (!orderid) {
    return res.status(400).json({
      success: 0,
      message: "Order ID is required",
    });
  }

  try {
    // FIND ORDER
    const order = await Order.findOne({
      orderid,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: 0,
        message: "Order not found",
      });
    }

    // BLOCK INVALID STATUS
    if (["refunded", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        success: 0,
        message: "Cannot resend OTP for this order",
      });
    }

    // OPTIONAL: PREVENT MULTIPLE RESENDS
    // if (order.resendRequested) {
    //   return res.status(400).json({
    //     success: 0,
    //     message: "OTP resend already requested",
    //   });
    // }

    // SEND REQUEST
    const response = await axios.post(
      `${SMSPOOL_BASE_URL}/sms/resend`,
      null,
      {
        params: {
          key: API_KEY,
          orderid,
        },
        timeout: 15000,
      }
    );

    const data = response.data;

    if (data?.success === 1) {
      order.resendRequested = true;
      order.lastResendAt = new Date();

      await order.save();

      return res.status(200).json({
        success: 1,
        message: data.message || "OTP resent successfully",
      });
    }

    return res.status(400).json({
      success: 0,
      message: data?.message || "Failed to resend OTP",
    });

  } catch (err) {
    console.error(
      "Resend OTP Error:",
      err.response?.data || err.message
    );

    return res.status(500).json({
      success: 0,
      message: "Failed to resend OTP",
    });
  }
};

/* =====================================================
   CANCEL / REFUND
===================================================== */
const cancelOrder = async (req, res) => {
  const { orderid } = req.body;
  if (!orderid) return res.status(400).json({ success: 0, message: "Order ID required" });

  try {
    const order = await Order.findOne({ orderid, user: req.user.id });
    if (!order) return res.status(404).json({ success: 0, message: "Order not found" });

    // Block refund after OTP is received
    if (order.status === "received" || order.status === "refunded") {
      return res.status(400).json({ success: 0, message: "Cannot refund after OTP has been received" });
    }

    if (order.status !== "waiting") {
      return res.status(400).json({ success: 0, message: "Order cannot be refunded" });
    }

    if (order.refunded) return res.status(400).json({ success: 0, message: "Order already refunded" });

    await axios.post(`${SMSPOOL_BASE_URL}/sms/cancel`, null, { params: { key: API_KEY, orderid } });

    const user = await User.findById(order.user);
    user.walletBalanceNGN += order.priceCharged;
    await user.save();

    order.status = "refunded";
    order.refunded = true;
    order.refundedAt = new Date();
    order.profit = 0;
    await order.save();

    return res.json({
      success: 1,
      message: "Order refunded successfully",
      refundedAmount: order.priceCharged,
      newBalance: user.walletBalanceNGN,
    });

  } catch (err) {
    console.error("Refund Error:", err.response?.data || err.message);
    res.status(500).json({ success: 0, message: "Refund failed" });
  }
};

/* =====================================================
   GET USER ORDERS
===================================================== */
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: 1, data: orders });
  } catch (err) {
    console.error("Fetch Orders Error:", err.message);
    res.status(500).json({ success: 0, message: "Failed to fetch orders" });
  }
};

module.exports = {
  getServers,
  getServices,
  buyNumber,
  getOtp,
  resendOtp,
  cancelOrder,
  getUserOrders,
};
