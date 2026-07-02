const axios = require("axios");
const User = require("../models/User");
const Order = require("../models/Order");

const SMSPOOL_BASE_URL = "https://api.smspool.net";
const API_KEY = process.env.SMS_POOL_API_KEY;

const USD_TO_NGN = 1500;
const MARKUP_PERCENT = 100;
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
   GET SERVICES WITH LIVE PRICING
===================================================== */
const getServices = async (req, res) => {
  try {
    // Prevent browser/CDN caching
    res.set("Cache-Control", "no-store");

    const [servicesRes, pricingRes] = await Promise.all([
      axios.get(
        `${SMSPOOL_BASE_URL}/service/retrieve_all`,
        {
          params: { key: API_KEY },
        }
      ),
      axios.get(
        `${SMSPOOL_BASE_URL}/request/pricing`,
        {
          params: { key: API_KEY },
        }
      ),
    ]);

    const services = servicesRes.data.map((service) => {
      // Get all pricing records for this service
      const servicePricing = pricingRes.data.filter(
        (p) =>
          String(p.service) ===
          String(service.ID)
      );

      // Group by country and keep lowest price
      const pricingByCountry = {};

      servicePricing.forEach((p) => {
        const countryId = String(p.country);

        const basePriceNGN =
          Number(p.price) * USD_TO_NGN;

        const sellingPriceNGN =
          basePriceNGN * MARKUP_MULTIPLIER;

        const item = {
          countryID: countryId,
          pool: p.pool,
          basePriceNGN,
          priceNGN: Math.ceil(
            sellingPriceNGN
          ),
        };

        // Keep cheapest price only
        if (
          !pricingByCountry[countryId] ||
          item.priceNGN <
            pricingByCountry[countryId].priceNGN
        ) {
          pricingByCountry[countryId] =
            item;
        }
      });

      return {
        ID: String(service.ID),
        name: service.name,

        // convert object → array
        pricing: Object.values(
          pricingByCountry
        ),
      };
    });

    res.json(services);

  } catch (err) {
    console.error(
      "Service Error:",
      err.response?.data ||
      err.message
    );

    return res.status(500).json([]);
  }
};

// /* =====================================================
//    BUY NUMBER (UPDATED)
// ===================================================== */
// const buyNumber = async (req, res) => {
//   const { country, service } = req.body;

//   if (!country || !service) {
//     return res
//       .status(400)
//       .json({ success: 0, message: "Country and service are required" });
//   }

//   try {
//     const user = await User.findById(req.user.id);
//     if (!user)
//       return res.status(404).json({ success: 0, message: "User not found" });

//     // Get pricing
//     const pricingRes = await axios.get(
//       `${SMSPOOL_BASE_URL}/request/pricing`,
//       { params: { key: API_KEY } }
//     );

//     const priceInfo = pricingRes.data.find(
//       (p) =>
//         String(p.service) === String(service) &&
//         String(p.country) === String(country)
//     );

//     if (!priceInfo)
//       return res
//         .status(400)
//         .json({ success: 0, message: "Service not available for selected country" });

//     const basePriceNGN = Number(priceInfo.price) * USD_TO_NGN;
//     const sellingPriceNGN = basePriceNGN * MARKUP_MULTIPLIER;

//     if (user.walletBalanceNGN < sellingPriceNGN)
//       return res
//         .status(400)
//         .json({ success: 0, message: "Insufficient balance" });

//     // Fetch country
//     const countryRes = await axios.get(
//       `${SMSPOOL_BASE_URL}/country/retrieve_all`,
//       { params: { key: API_KEY } }
//     );

//     const selectedCountry = countryRes.data.find(
//       (c) => String(c.ID) === String(country)
//     );

//     if (!selectedCountry)
//       return res
//         .status(400)
//         .json({ success: 0, message: "Invalid country selected" });

//     // ✅ Fetch service name
//     const servicesRes = await axios.get(
//       `${SMSPOOL_BASE_URL}/service/retrieve_all`,
//       { params: { key: API_KEY } }
//     );

//     const selectedService = servicesRes.data.find(
//       (s) => String(s.ID) === String(service)
//     );

//     if (!selectedService)
//       return res
//         .status(400)
//         .json({ success: 0, message: "Invalid service selected" });

//     const purchaseRes = await axios.post(
//       `${SMSPOOL_BASE_URL}/purchase/sms`,
//       null,
//       { params: { key: API_KEY, country, service, quantity: 1 } }
//     );

//     if (!purchaseRes.data || purchaseRes.data.success === 0) {
//       return res.status(500).json({
//         success: 0,
//         message: purchaseRes.data?.message || "Purchase failed",
//       });
//     }

//     const { number, orderid } = purchaseRes.data;

//     // Deduct wallet
//     user.walletBalanceNGN -= sellingPriceNGN;
//     await user.save();

//     // ✅ SAVE SERVICE NAME
//     const order = new Order({
//       user: user._id,
//       service: {
//         id: String(service),
//         name: selectedService.name,
//       },
//       country: {
//         id: String(country),
//         code: selectedCountry.short_name,
//       },
//       orderid,
//       number,
//       baseCost: basePriceNGN,
//       priceCharged: sellingPriceNGN,
//       profit: sellingPriceNGN - basePriceNGN,
//       status: "waiting",
//     });

//     await order.save();

//     res.json({
//       success: 1,
//       message: "Number purchased successfully",
//       data: {
//         number,
//         orderid,
//         pricePaid: sellingPriceNGN,
//         countryCode: selectedCountry.short_name,
//         serviceName: selectedService.name,
//       },
//       remainingBalance: user.walletBalanceNGN,
//     });
//   } catch (err) {
//     console.error("Buy Error:", err.response?.data || err.message);
//     res.status(500).json({ success: 0, message: "Purchase failed" });
//   }
// };

/* =====================================================
   BUY NUMBER (LIVE PRICE + AUTO POOL SELECTION)
===================================================== */
const buyNumber = async (req, res) => {
  const { country, service } = req.body;

  if (!country || !service) {
    return res.status(400).json({
      success: 0,
      message: "Country and service are required",
    });
  }

  try {
    /* ==========================
       GET USER
    ========================== */
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: 0,
        message: "User not found",
      });
    }

    /* ==========================
       GET LIVE PRICE
       (prevents surge losses)
    ========================== */

    const livePriceRes = await axios.post(
      `${SMSPOOL_BASE_URL}/request/price`,
      null,
      {
        params: {
          key: API_KEY,
          country,
          service,
        },
      }
    );

    if (
      !livePriceRes.data ||
      !livePriceRes.data.price
    ) {
      return res.status(400).json({
        success: 0,
        message:
          "Service unavailable for this country",
      });
    }

    const basePriceNGN =
      Number(livePriceRes.data.price) *
      USD_TO_NGN;

    const sellingPriceNGN = Math.ceil(
      basePriceNGN *
      MARKUP_MULTIPLIER
    );

    const successRate =
      livePriceRes.data.success_rate || 0;

    /* ==========================
       CHECK WALLET BALANCE
    ========================== */

    if (
      user.walletBalanceNGN <
      sellingPriceNGN
    ) {
      return res.status(400).json({
        success: 0,
        message:
          "Insufficient balance",
      });
    }

    /* ==========================
       GET COUNTRY
    ========================== */

    const countryRes = await axios.get(
      `${SMSPOOL_BASE_URL}/country/retrieve_all`,
      {
        params: {
          key: API_KEY,
        },
      }
    );

    const selectedCountry =
      countryRes.data.find(
        (c) =>
          String(c.ID) ===
          String(country)
      );

    if (!selectedCountry) {
      return res.status(400).json({
        success: 0,
        message:
          "Invalid country selected",
      });
    }

    /* ==========================
       GET SERVICE
    ========================== */

    const servicesRes = await axios.get(
      `${SMSPOOL_BASE_URL}/service/retrieve_all`,
      {
        params: {
          key: API_KEY,
        },
      }
    );

    const selectedService =
      servicesRes.data.find(
        (s) =>
          String(s.ID) ===
          String(service)
      );

    if (!selectedService) {
      return res.status(400).json({
        success: 0,
        message:
          "Invalid service selected",
      });
    }

    /* ==========================
       PURCHASE
       SMSPool auto-selects pool
    ========================== */

    const purchaseRes =
      await axios.post(
        `${SMSPOOL_BASE_URL}/purchase/sms`,
        null,
        {
          params: {
            key: API_KEY,
            country,
            service,
            quantity: 1,
          },
        }
      );

    if (
      !purchaseRes.data ||
      purchaseRes.data.success === 0
    ) {
      return res.status(400).json({
        success: 0,
        message:
          purchaseRes.data?.message ||
          "Purchase failed",
      });
    }

    const {
      number,
      orderid,
      pool,
    } = purchaseRes.data;

    /* ==========================
       DEDUCT WALLET
    ========================== */

    user.walletBalanceNGN -=
      sellingPriceNGN;

    await user.save();

    /* ==========================
       SAVE ORDER
    ========================== */

    const order =
      new Order({
        user: user._id,

        service: {
          id: String(service),
          name:
            selectedService.name,
        },

        country: {
          id: String(country),
          code:
            selectedCountry.short_name,
        },

        orderid,
        number,

        pool: pool || null,

        baseCost:
          basePriceNGN,

        priceCharged:
          sellingPriceNGN,

        profit:
          sellingPriceNGN -
          basePriceNGN,

        successRate,

        status: "waiting",
      });

    await order.save();

    return res.json({
      success: 1,
      message:
        "Number purchased successfully",

      data: {
        number,
        orderid,

        pricePaid:
          sellingPriceNGN,

        countryCode:
          selectedCountry.short_name,

        serviceName:
          selectedService.name,

        pool:
          pool || null,

        successRate,
      },

      remainingBalance:
        user.walletBalanceNGN,
    });

  } catch (err) {

    console.error(
      "Buy Error:",
      err.response?.data ||
      err.message
    );

    return res.status(500).json({
      success: 0,
      message:
        err.response?.data?.message ||
        "Purchase failed",
    });
  }
};

// /* =====================================================
//    BUY NUMBER (LIVE PRICE + HIGH PRICE PROTECTION)
// ===================================================== */
// const buyNumber = async (req, res) => {
//   const { country, service } = req.body;

//   if (!country || !service) {
//     return res.status(400).json({
//       success: 0,
//       message: "Country and service are required",
//     });
//   }

//   try {
//     /* ==========================
//        GET USER
//     ========================== */

//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: 0,
//         message: "User not found",
//       });
//     }

//     /* ==========================
//        GET LIVE PRICE
//     ========================== */

//     const livePriceRes = await axios.post(
//       `${SMSPOOL_BASE_URL}/request/price`,
//       null,
//       {
//         params: {
//           key: API_KEY,
//           country,
//           service,
//         },
//       }
//     );

//     if (
//       !livePriceRes.data ||
//       (
//         !livePriceRes.data.price &&
//         !livePriceRes.data.high_price
//       )
//     ) {
//       return res.status(400).json({
//         success: 0,
//         message:
//           "Service unavailable for this country",
//       });
//     }

//     /* ==========================
//        USE HIGH PRICE
//        protects against price jumps
//     ========================== */

//     const livePrice = Number(
//       livePriceRes.data.high_price ||
//       livePriceRes.data.price ||
//       0
//     );

//     if (!livePrice) {
//       return res.status(400).json({
//         success: 0,
//         message: "Price unavailable",
//       });
//     }

//     const basePriceNGN =
//       livePrice *
//       USD_TO_NGN;

//     const sellingPriceNGN =
//       Math.ceil(
//         basePriceNGN *
//         MARKUP_MULTIPLIER
//       );

//     const successRate =
//       Number(
//         livePriceRes.data.success_rate
//       ) || 0;

//     /* ==========================
//        CHECK BALANCE
//     ========================== */

//     if (
//       user.walletBalanceNGN <
//       sellingPriceNGN
//     ) {
//       return res.status(400).json({
//         success: 0,
//         message:
//           "Insufficient balance",
//       });
//     }

//     /* ==========================
//        GET COUNTRY
//     ========================== */

//     const countryRes =
//       await axios.get(
//         `${SMSPOOL_BASE_URL}/country/retrieve_all`,
//         {
//           params: {
//             key: API_KEY,
//           },
//         }
//       );

//     const selectedCountry =
//       countryRes.data.find(
//         (c) =>
//           String(c.ID) ===
//           String(country)
//       );

//     if (!selectedCountry) {
//       return res.status(400).json({
//         success: 0,
//         message:
//           "Invalid country selected",
//       });
//     }

//     /* ==========================
//        GET SERVICE
//     ========================== */

//     const servicesRes =
//       await axios.get(
//         `${SMSPOOL_BASE_URL}/service/retrieve_all`,
//         {
//           params: {
//             key: API_KEY,
//           },
//         }
//       );

//     const selectedService =
//       servicesRes.data.find(
//         (s) =>
//           String(s.ID) ===
//           String(service)
//       );

//     if (!selectedService) {
//       return res.status(400).json({
//         success: 0,
//         message:
//           "Invalid service selected",
//       });
//     }

//     /* ==========================
//        PURCHASE
//        SMSPool auto-selects pool
//     ========================== */

//     const purchaseRes =
//       await axios.post(
//         `${SMSPOOL_BASE_URL}/purchase/sms`,
//         null,
//         {
//           params: {
//             key: API_KEY,
//             country,
//             service,
//             quantity: 1,
//           },
//         }
//       );

//     if (
//       !purchaseRes.data ||
//       purchaseRes.data.success === 0
//     ) {
//       return res.status(400).json({
//         success: 0,
//         message:
//           purchaseRes.data?.message ||
//           "Purchase failed",
//       });
//     }

//     const {
//       number,
//       orderid,
//       pool,
//     } = purchaseRes.data;

//     /* ==========================
//        DEDUCT WALLET
//     ========================== */

//     user.walletBalanceNGN -=
//       sellingPriceNGN;

//     await user.save();

//     /* ==========================
//        SAVE ORDER
//     ========================== */

//     const order =
//       new Order({
//         user: user._id,

//         service: {
//           id: String(service),
//           name:
//             selectedService.name,
//         },

//         country: {
//           id: String(country),
//           code:
//             selectedCountry.short_name,
//         },

//         orderid,
//         number,

//         pool: pool || null,

//         baseCost:
//           basePriceNGN,

//         priceCharged:
//           sellingPriceNGN,

//         profit:
//           sellingPriceNGN -
//           basePriceNGN,

//         successRate,

//         status: "waiting",
//       });

//     await order.save();

//     return res.json({
//       success: 1,
//       message:
//         "Number purchased successfully",

//       data: {
//         number,
//         orderid,

//         pricePaid:
//           sellingPriceNGN,

//         countryCode:
//           selectedCountry.short_name,

//         serviceName:
//           selectedService.name,

//         pool:
//           pool || null,

//         successRate,
//       },

//       remainingBalance:
//         user.walletBalanceNGN,
//     });

//   } catch (err) {

//     console.error(
//       "Buy Error:",
//       err.response?.data ||
//       err.message
//     );

//     return res.status(500).json({
//       success: 0,
//       message:
//         err.response?.data?.errors?.[0]?.message ||
//         err.response?.data?.message ||
//         "Purchase failed",
//     });
//   }
// };

// // /* =====================================================
// //    GET OTP
// // ===================================================== */
// const getOtp = async (req, res) => {
//   const { orderid } = req.body;

//   if (!orderid) {
//     return res.status(400).json({
//       success: 0,
//       message: "Order ID is required",
//     });
//   }

//   try {
//     const order = await Order.findOne({ orderid });

//     if (!order) {
//       return res.status(404).json({
//         success: 0,
//         message: "Order not found",
//       });
//     }

//     // ✅ If OTP already received, return immediately
//     if (order.status === "received" && order.otp) {
//       return res.json({
//         success: 1,
//         otp: order.otp,
//         status: "received",
//         message: "OTP already received",
//       });
//     }

//     // Request OTP from SMSPool
//     const response = await axios.post(
//       `${SMSPOOL_BASE_URL}/sms/check`,
//       null,
//       {
//         params: {
//           key: API_KEY,
//           orderid,
//         },
//       }
//     );

//     const status = Number(response.data.status);
//     const sms = response.data.sms;

//     // ✅ OTP received
//     if (status === 3 && sms) {
//       const otp = sms.match(/\d{4,6}/)?.[0];

//       if (otp) {
//         order.otp = otp;
//         order.status = "received";
//         await order.save();

//         return res.json({
//           success: 1,
//           otp,
//           status: "received",
//           message: "OTP received successfully",
//         });
//       }
//     }

//     // ❌ Order expired
//     if (status === 4) {
//       order.status = "cancelled";
//       await order.save();

//       return res.json({
//         success: 0,
//         status: "cancelled",
//         message: "Order expired or cancelled",
//       });
//     }

//     // ⏳ Still waiting
//     return res.json({
//       success: 0,
//       status: "waiting",
//       message: "OTP not yet available",
//     });

//   } catch (err) {
//     console.error("OTP Error:", err.response?.data || err.message);

//     res.status(500).json({
//       success: 0,
//       message: "Failed to check OTP",
//     });
//   }
// };

const getOtp = async (req, res) => {
  const { orderid } = req.body;

  if (!orderid) {
    return res.status(400).json({
      success: 0,
      message: "Order ID is required",
    });
  }

  try {
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

    // If we're NOT waiting for a resent OTP,
    // return cached OTP immediately.
    if (
      order.status === "received" &&
      order.otp &&
      !order.awaitingResend
    ) {
      return res.json({
        success: 1,
        otp: order.otp,
        status: "received",
        message: "OTP already received",
      });
    }

    // Always check SMSPool when waiting for resend
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
    const sms = response.data.sms || "";

    // OTP received
    if (status === 3 && sms) {
      const otp = sms.match(/\d{4,6}/)?.[0];

      if (otp) {

        // New OTP after resend
        if (
          order.awaitingResend &&
          otp !== order.otp
        ) {
          order.otp = otp;
          order.awaitingResend = false;
          order.status = "received";

          await order.save();

          return res.json({
            success: 1,
            otp,
            status: "received",
            message: "New OTP received",
          });
        }

        // First OTP
        if (!order.otp) {
          order.otp = otp;
          order.status = "received";

          await order.save();
        }

        return res.json({
          success: 1,
          otp: order.otp,
          status: "received",
          message: "OTP received successfully",
        });
      }
    }

    // Expired
    if (status === 4) {
      order.status = "cancelled";
      order.awaitingResend = false;

      await order.save();

      return res.json({
        success: 0,
        status: "cancelled",
        message: "Order expired",
      });
    }

    // Waiting
    return res.json({
      success: 0,
      status: "waiting",
      message: order.awaitingResend
        ? "Waiting for new OTP..."
        : "OTP not yet available",
    });

  } catch (err) {
    console.error(
      "OTP Error:",
      err.response?.data || err.message
    );

    return res.status(500).json({
      success: 0,
      message: "Failed to check OTP",
    });
  }
};

// /* =====================================================
//    RESEND OTP
// ===================================================== */
// const resendOtp = async (req, res) => {
//   const { orderid } = req.body;

//   if (!orderid) {
//     return res.status(400).json({
//       success: 0,
//       message: "Order ID is required",
//     });
//   }

//   try {
//     const order = await Order.findOne({
//       orderid,
//       user: req.user.id,
//     });
 
//     if (!order) {
//       return res.status(404).json({
//         success: 0,
//         message: "Order not found",
//       });
//     }

//     if (["refunded", "cancelled"].includes(order.status)) {
//       return res.status(400).json({
//         success: 0,
//         message: "Cannot resend OTP for this order",
//       });
//     }

//     // Step 1: resend
//     const resendResponse = await axios.post(
//       `${SMSPOOL_BASE_URL}/sms/resend`,
//       null,
//       {
//         params: {
//           key: API_KEY,
//           orderid,
//         },
//       }
//     );

//     if (resendResponse.data?.success !== 1) {
//       return res.status(400).json({
//         success: 0,
//         message: "Failed to resend OTP",
//       });
//     }

//     // Step 2: wait briefly
//     await new Promise(resolve => setTimeout(resolve, 3000));

//     // Step 3: check for new OTP
//     const checkResponse = await axios.post(
//       `${SMSPOOL_BASE_URL}/sms/check`,
//       null,
//       {
//         params: {
//           key: API_KEY,
//           orderid,
//         },
//       }
//     );

//     const sms = checkResponse.data?.sms;

//     if (sms) {
//       const newOtp = sms.match(/\d{4,6}/)?.[0];

//       if (newOtp) {
//         order.otp = newOtp;
//         order.status = "received";
//         order.lastResendAt = new Date();
//         await order.save();

//         return res.json({
//           success: 1,
//           otp: newOtp,
//           message: "New OTP received",
//         });
//       }
//     }

//     return res.json({
//       success: 1,
//       message: "OTP resend requested, waiting for new code",
//     });

//   } catch (err) {
//     console.error(
//       "Resend OTP Error:",
//       err.response?.data || err.message
//     );

//     return res.status(500).json({
//       success: 0,
//       message: "Failed to resend OTP",
//     });
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

    if (["refunded", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        success: 0,
        message: "Cannot resend OTP for this order",
      });
    }

    // Prevent spam (30 seconds)
    if (
      order.lastResendAt &&
      Date.now() - new Date(order.lastResendAt).getTime() < 30000
    ) {
      return res.status(429).json({
        success: 0,
        message: "Please wait 30 seconds before requesting another resend.",
      });
    }

    const resendResponse = await axios.post(
      `${SMSPOOL_BASE_URL}/sms/resend`,
      null,
      {
        params: {
          key: API_KEY,
          orderid,
        },
      }
    );

    if (resendResponse.data?.success !== 1) {
      return res.status(400).json({
        success: 0,
        message:
          resendResponse.data?.message || "Failed to resend OTP",
      });
    }

    // Tell getOtp() to keep checking SMSPool
    order.awaitingResend = true;
    order.lastResendAt = new Date();

    await order.save();

    return res.json({
      success: 1,
      message: "OTP resend requested successfully",
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

/* =====================================================
   GET SMS STATS
===================================================== */
const getSmsStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const smsReceived = await Order.countDocuments({
            user: userId,
            status: "received",
        });

        const totalSms = await Order.countDocuments({
            user: userId,
        });

        const successRate =
            totalSms === 0 ? 0 : (smsReceived / totalSms) * 100;

        res.json({
            smsReceived,
            totalSms,
            successRate: successRate.toFixed(2),
        });
    } catch (err) {
        console.error("SMS stats error:", err);
        res.status(500).json({ message: "Failed to fetch SMS stats" });
    }
};


/* =====================================================
   DASHBOARD OVERVIEW
===================================================== */
const getDashboardOverview = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. NUMBERS OWNED (unique numbers)
        const numbersOwned = await Order.distinct("number", {
            user: userId,
        });

        // 2. COUNTRIES COVERED (unique country codes)
        const countriesCovered = await Order.distinct("country.code", {
            user: userId,
        });

        // 3. SUCCESS RATE (received vs total)
        const totalOrders = await Order.countDocuments({
            user: userId,
        });

        const receivedOrders = await Order.countDocuments({
            user: userId,
            status: "received",
        });

        const successRate =
            totalOrders === 0
                ? 0
                : (receivedOrders / totalOrders) * 100;

        return res.json({
            numbersOwned: numbersOwned.length,
            countriesCovered: countriesCovered.length,
            successRate: Number(successRate.toFixed(2)),
        });
    } catch (err) {
        console.error("Dashboard overview error:", err);
        return res.status(500).json({
            message: "Failed to fetch dashboard overview",
        });
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
  getSmsStats,
  getDashboardOverview,
};
