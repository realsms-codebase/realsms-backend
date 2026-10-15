import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

// =====================
// JWT TOKEN HELPER
// =====================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// =====================
// EMAIL CODE HELPER
// =====================
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashCode = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

// =====================
// SEND VERIFICATION EMAIL
// =====================
const sendVerificationEmail = async (user, code) => {
  await sendEmail({
    to: user.email,
    subject: "Verify Your RealSMS Email",
    text: `Hello ${user.firstName}, your RealSMS verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;color:#222;line-height:1.6;">
        <h2>Verify your email</h2>
        <p>Hello ${user.firstName},</p>
        <p>Use this code to complete your RealSMS registration:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:20px;background:#f4f4f8;text-align:center;border-radius:8px;">
          ${code}
        </div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
};

// =====================
// REGISTER USER
// =====================
export const registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const code = generateVerificationCode();

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      status: "Active",

      // New registrations must verify their email.
      emailVerified: false,
      emailVerificationCode: hashCode(code),
      emailVerificationExpire: new Date(
        Date.now() + 10 * 60 * 1000
      ),
    });

    try {
      await sendVerificationEmail(user, code);
    } catch (emailError) {
      console.error("VERIFICATION EMAIL ERROR:", emailError);

      // Keep the account so the user can request another code.
      return res.status(201).json({
        success: true,
        emailSent: false,
        email: user.email,
        message:
          "Account created, but the verification email could not be sent. Please request a new code.",
      });
    }

    return res.status(201).json({
      success: true,
      emailSent: true,
      email: user.email,
      message: "Verification code sent to your email.",
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================
// VERIFY EMAIL
// =====================
export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  try {
    if (
      !email?.trim() ||
      typeof code !== "string" ||
      !/^\d{6}$/.test(code)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid email and 6-digit code are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      emailVerified: false,
      emailVerificationCode: hashCode(code),
      emailVerificationExpire: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpire = undefined;

    await user.save();

    return res.json({
      success: true,
      message: "Email verified successfully. You can now sign in.",
    });
  } catch (err) {
    console.error("VERIFY EMAIL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================
// RESEND VERIFICATION CODE
// =====================
export const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email.",
      });
    }

    if (user.emailVerified !== false) {
      return res.status(400).json({
        success: false,
        message: "This email has already been verified.",
      });
    }

    const code = generateVerificationCode();

    user.emailVerificationCode = hashCode(code);
    user.emailVerificationExpire = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await user.save();

    try {
      await sendVerificationEmail(user, code);
    } catch (emailError) {
      console.error("RESEND VERIFICATION EMAIL ERROR:", emailError);

      // Clear the unsent code so it cannot be used.
      user.emailVerificationCode = undefined;
      user.emailVerificationExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: "Could not send the verification email. Please try again.",
      });
    }

    return res.json({
      success: true,
      message: "A new verification code has been sent to your email.",
    });
  } catch (err) {
    console.error("RESEND CODE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================
// LOGIN USER
// =====================
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      email: email?.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Preserve existing account-ban protection.
    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned. Contact support.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Legacy accounts with no emailVerified field remain allowed.
    // New registrations explicitly have emailVerified: false.
    if (user.emailVerified === false) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before signing in.",
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
      },
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================
// GET CURRENT USER
// =====================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned.",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("GET ME ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================
// GET PROFILE
// =====================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "firstName lastName email"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================
// UPDATE PROFILE
// =====================
export const updateProfile = async (req, res) => {
  const { firstName, lastName } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.firstName = firstName?.trim() || user.firstName;
    user.lastName = lastName?.trim() || user.lastName;

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================
// FORGOT PASSWORD
// =====================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({
      email: email?.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpire = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save();

    const resetUrl =
      `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      text: `You requested a password reset. Click the link to reset: ${resetUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password.</p>
          <p>Click below to reset your password. This link expires in 15 minutes.</p>
          <a href="${resetUrl}" style="padding:10px 20px;background:#4caf50;color:#fff;text-decoration:none;border-radius:5px;">
            Reset Password
          </a>
          <p>If you did not request this, ignore this email.</p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// =====================
// RESET PASSWORD
// =====================
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
