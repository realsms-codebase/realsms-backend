// // // controllers/adminController.js

// // import User from "../models/User.js";
// // import { sendEmail } from "../utils/sendEmail.js";

// // export const sendBroadcastEmail = async (req, res) => {
// //   try {
// //     const { subject, message } = req.body;

// //     if (!subject || !message) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Subject and message are required",
// //       });
// //     }

// //     const users = await User.find({
// //       email: { $exists: true, $ne: "" },
// //     }).select("email");

// //     if (!users.length) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "No users found",
// //       });
// //     }

// //     const recipients = users.map((user) => user.email);

// //     await Promise.all(
// //       recipients.map((email) =>
// //         sendEmail({
// //           to: email,
// //           subject,
// //           text: message,
// //           html: `
// //             <div style="font-family: Arial, sans-serif; line-height:1.6;">
// //               <h2>${subject}</h2>
// //               <p>${message.replace(/\n/g, "<br/>")}</p>
// //             </div>
// //           `,
// //         })
// //       )
// //     );

// //     return res.status(200).json({
// //       success: true,
// //       message: `Broadcast email sent to ${recipients.length} users`,
// //     });
// //   } catch (error) {
// //     console.error("Broadcast Email Error:", error);

// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to send broadcast email",
// //     });
// //   }
// // };

// // controllers/adminController.js

// import User from "../models/User.js";
// import { sendEmail } from "../utils/sendEmail.js";

// const isValidEmail = (email) =>
//   typeof email === "string" &&
//   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// export const sendBroadcastEmail = async (req, res) => {
//   try {
//     const { subject, message } = req.body;

//     if (!subject || !message) {
//       return res.status(400).json({
//         success: false,
//         message: "Subject and message are required",
//       });
//     }

//     const users = await User.find({
//       email: { $exists: true, $ne: "" },
//     }).select("email");

//     const recipients = users
//       .map((u) => u.email?.trim())
//       .filter(isValidEmail);

//     if (!recipients.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No valid emails found",
//       });
//     }

//     const BATCH_SIZE = 10;
//     let failed = 0;

//     for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
//       const batch = recipients.slice(i, i + BATCH_SIZE);

//       const results = await Promise.allSettled(
//         batch.map((email) =>
//           sendEmail({
//             to: email,
//             subject,
//             text: message,
//             html: `
//               <div style="font-family: Arial, sans-serif; line-height:1.6;">
//                 <h2>${subject}</h2>
//                 <p>${message.replace(/\n/g, "<br/>")}</p>
//               </div>
//             `,
//           })
//         )
//       );

//       failed += results.filter((r) => r.status === "rejected").length;
//     }

//     return res.status(200).json({
//       success: true,
//       message: `Broadcast completed`,
//       total: recipients.length,
//       failed,
//     });
//   } catch (error) {
//     console.error("Broadcast Email Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to send broadcast email",
//     });
//   }
// };

// controllers/adminController.js

import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

// email validator
const isValidEmail = (email) =>
  typeof email === "string" &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const sendBroadcastEmail = async (req, res) => {
  try {
    const { subject, message, order = "oldest" } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    // 1. Fetch users
    let query = User.find({
      email: { $exists: true, $ne: "" },
    }).select("email createdAt");

    // 2. Optional ordering
    if (order === "oldest") query = query.sort({ createdAt: 1 });
    if (order === "newest") query = query.sort({ createdAt: -1 });

    const users = await query;

    // 3. Clean emails
    const recipients = users
      .map((u) => u.email?.trim())
      .filter(isValidEmail);

    if (!recipients.length) {
      return res.status(404).json({
        success: false,
        message: "No valid emails found",
      });
    }

    const BATCH_SIZE = 10;
    const DELAY_MS = 300;

    let delivered = 0;
    let failed = 0;
    let quotaExceeded = false;

    // helper delay
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    // 4. Batch sending (safe for SendGrid)
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((email) =>
          sendEmail({
            to: email,
            subject,
            text: message,
            html: `
              <div style="font-family: Arial, sans-serif; line-height:1.6;">
                <h2>${subject}</h2>
                <p>${message.replace(/\n/g, "<br/>")}</p>
              </div>
            `,
          })
        )
      );

      results.forEach((r) => {
        if (r.status === "fulfilled") {
          delivered++;
        } else {
          failed++;

          const errMsg = r.reason?.response?.body?.errors?.[0]?.message;

          if (errMsg === "Maximum credits exceeded") {
            quotaExceeded = true;
          }
        }
      });

      // STOP immediately if quota is exceeded
      if (quotaExceeded) {
        console.log("❌ SendGrid quota exceeded. Stopping broadcast.");
        break;
      }

      // small delay to avoid rate limits
      await delay(DELAY_MS);
    }

    return res.status(200).json({
      success: true,
      message: "Broadcast completed",
      total: recipients.length,
      delivered,
      failed,
      quotaExceeded,
    });
  } catch (error) {
    console.error("Broadcast Email Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send broadcast email",
    });
  }
};
