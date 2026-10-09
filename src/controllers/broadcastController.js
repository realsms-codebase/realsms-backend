// import User from "../models/User.js";
// import BroadcastProgress from "../models/BroadcastProgress.js";
// import { sendEmail } from "../utils/sendEmail.js";

// export const sendBroadcastEmail = async (req, res) => {
//   try {
//     const { subject, message } = req.body;

//     if (!subject || !message) {
//       return res.status(400).json({
//         success: false,
//         message: "Subject and message are required",
//       });
//     }

//     const LIMIT_PER_DAY = 50;

//     // Get all users sorted oldest → newest
//     const users = await User.find({
//       email: { $exists: true, $ne: "" },
//     })
//       .sort({ createdAt: 1 })
//       .select("email");

//     if (!users.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No users found",
//       });
//     }

//     // Get progress tracker
//     let progress = await BroadcastProgress.findOne();

//     if (!progress) {
//       progress = await BroadcastProgress.create({ lastIndex: 0 });
//     }

//     if (progress.completed) {
//       return res.status(200).json({
//         success: true,
//         message: "All emails already sent",
//       });
//     }

//     const start = progress.lastIndex;
//     const end = Math.min(start + LIMIT_PER_DAY, users.length);

//     const batch = users.slice(start, end);

//     for (const user of batch) {
//       try {
//         await sendEmail({
//           to: user.email,
//           subject,
//           text: message,
//           html: `
//             <div style="font-family: Arial, sans-serif; line-height:1.6;">
//               <h2>${subject}</h2>
//               <p>${message.replace(/\n/g, "<br/>")}</p>
//             </div>
//           `,
//         });
//       } catch (err) {
//         console.error(`Failed for ${user.email}`, err);
//       }
//     }

//     progress.lastIndex = end;
//     progress.completed = end >= users.length;
//     progress.updatedAt = new Date();
//     await progress.save();

//     return res.status(200).json({
//       success: true,
//       message: `Sent ${batch.length} emails (${end}/${users.length})`,
//       completed: progress.completed,
//     });
//   } catch (error) {
//     console.error("Broadcast Email Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to send broadcast email",
//     });
//   }
// };


import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

export const sendBroadcastEmail = async (req, res) => {
  try {
    const { subject, message } = req.body;

    // Validate input
    if (
      typeof subject !== "string" ||
      typeof message !== "string" ||
      !subject.trim() ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    // Escape user-provided text before inserting it into HTML
    const escapeHtml = (value) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const safeSubject = escapeHtml(subject.trim());

    const safeMessage = escapeHtml(message.trim())
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n/g, "<br/>");

    // Select the first 70 users with email addresses,
    // ordered from oldest account to newest.
    const users = await User.find({
      email: {
        $exists: true,
        $type: "string",
        $ne: "",
      },
    })
      .sort({ createdAt: 1, _id: 1 })
      .limit(70)
      .select("email")
      .lean();

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No users with email addresses found",
      });
    }

    let sent = 0;
    let failed = 0;

    // Send emails sequentially
    for (const user of users) {
      try {
        await sendEmail({
          to: user.email,
          subject: subject.trim(),
          text: message.trim(),
          html: `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>${safeSubject}</title>
              </head>
              <body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,sans-serif;color:#333;">
                <div style="max-width:600px;margin:0 auto;padding:24px;background:#ffffff;border-radius:8px;">
                  <h2 style="margin-top:0;font-size:22px;">
                    ${safeSubject}
                  </h2>
                  <div style="font-size:15px;line-height:1.8;overflow-wrap:anywhere;">
                    ${safeMessage}
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        sent++;
        console.log(`Broadcast email accepted by Resend for: ${user.email}`);
      } catch (err) {
        failed++;

        console.error(
          `Broadcast email failed for ${user.email}:`,
          err.message
        );
      }
    }

    const completed = failed === 0;

    return res.status(200).json({
      success: failed === 0,
      message: `Broadcast finished. Sent: ${sent}, Failed: ${failed}, Selected: ${users.length}.`,
      sent,
      failed,
      total: users.length,
      completed,
    });
  } catch (error) {
    console.error("Broadcast Email Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send broadcast email",
    });
  }
};
