// import sgMail from "@sendgrid/mail";

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// export const sendEmail = async ({ to, subject, text, html }) => {
//   try {
//     await sgMail.send({
//       to,
//       from: process.env.EMAIL_FROM,
//       subject,
//       text,
//       html,
//     });
//   } catch (error) {
//     console.error(error.response?.body || error);
//     throw new Error("Email could not be sent");
//   }
// };


const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({
    to,
    subject,
    html,
}) => {
    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
        });

        return true;
    } catch (error) {
        console.error(
            "Resend Error:",
            error?.message || error
        );

        throw new Error("Failed to send email.");
    }
};

module.exports = sendEmail;
