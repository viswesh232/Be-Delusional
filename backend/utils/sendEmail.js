require('dotenv').config();
const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER || '';
const emailPass = process.env.EMAIL_PASS || '';
const hasEmailCredentials = Boolean(emailUser && emailPass);

if (!hasEmailCredentials) {
    console.warn('Email credentials are missing; email sending will be skipped until EMAIL_USER and EMAIL_PASS are configured.');
}

const transporter = hasEmailCredentials ? nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailUser,
        pass: emailPass,
    },
}) : null;

if (transporter) {
    transporter.verify((error, success) => {
        if (error) {
            console.error('SMTP Connection Error:', error);
        } else {
            console.log('SMTP Server is ready to take our messages');
        }
    });
}

/**
 * Standard Email Wrapper for True Threads Apparel
 * Minimalist, luxury editorial aesthetic.
 */
const wrapTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        .container {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .header {
            background: #09090b;
            padding: 32px 20px;
            text-align: center;
        }
        .header span {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
        }
        .body {
            padding: 36px 30px;
            line-height: 1.65;
            color: #1f2937;
        }
        .footer {
            background: #f9fafb;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #f3f4f6;
        }
        .button {
            display: inline-block;
            margin: 24px 0;
            padding: 14px 30px;
            background: #09090b;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span>True Threads</span>
        </div>
        <div class="body">
            ${content}
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} True Threads Apparel. All rights reserved.<br>
            Premium Garments & Modern Streetwear.
        </div>
    </div>
</body>
</html>`;

/**
 * Generic Email Sender
 */
const sendEmail = async (email, subject, text, html) => {
    console.log(`[Email Service] Attempting to send email to: ${email}`);

    if (!transporter || !hasEmailCredentials) {
        console.warn(`[Email Service] Skipping email to ${email} because credentials are not configured.`);
        return { success: false, skipped: true, error: 'Email credentials are not configured.' };
    }

    try {
        const mailOptions = {
            from: `"True Threads" <${emailUser}>`,
            to: email,
            subject: subject,
            text: text,
            html: html || wrapTemplate(`<p>${text}</p>`),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] SUCCESS: Email sent to ${email}. MessageID: ${info.messageId}`);
        return { success: true, info };
    } catch (error) {
        console.error('--- NODEMAILER ERROR ---');
        console.error(`To: ${email}`);
        console.error(`Subject: ${subject}`);
        console.error('Error Code:', error.code || 'N/A');
        console.error('Error Message:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Account Verification
 */
const sendVerificationEmail = async (email, verificationUrl) => {
    const html = wrapTemplate(`
        <h2 style="color: #09090b; margin-top: 0; font-size: 22px;">Verify Your Email Address</h2>
        <p>Welcome to <strong>True Threads</strong>! We are delighted to have you. To activate your account and start shopping our latest apparel drops, please verify your email address below:</p>
        <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify My Account</a>
        </div>
        <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all; color: #111827;">${verificationUrl}</span>
        </p>
    `);

    return sendEmail(email, 'Verify Your True Threads Account', 'Please verify your account.', html);
};

/**
 * Order Updates (Dispatch, tracking, delivery)
 */
const sendOrderUpdateEmail = async (email, { customerName, orderId, message, trackingId, courierName }) => {
    const trackingHtml = trackingId ? `
        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e4e4e7;">
            <p style="margin: 0; font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">COURIER & TRACKING</p>
            <p style="margin: 6px 0 0; font-size: 16px; color: #09090b; font-weight: 700;">
                ${courierName || 'Express Courier'}: <span style="color: #2563eb;">${trackingId}</span>
            </p>
        </div>` : '';

    const html = wrapTemplate(`
        <h2 style="color: #09090b; margin-top: 0; font-size: 20px;">Hi ${customerName},</h2>
        <p>Here is an update regarding your order <strong style="color: #09090b;">${orderId}</strong>:</p>
        <div style="font-size: 15px; padding: 16px; background: #fafafa; border-left: 4px solid #09090b; border-radius: 4px; margin: 16px 0;">
            ${message}
        </div>
        ${trackingHtml}
        <p style="font-size: 14px; color: #71717a;">Log in to your account at any time to track progress or initiate a size exchange.</p>
    `);

    return sendEmail(email, `Update on Order ${orderId} | True Threads`, message, html);
};

/**
 * Password Reset
 */
const sendPasswordResetEmail = async (email, resetUrl) => {
    const html = wrapTemplate(`
        <h2 style="color: #09090b; margin-top: 0; font-size: 22px;">Reset Your Password</h2>
        <p>We received a request to reset your password for your <strong>True Threads</strong> account.</p>
        <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">This link expires in 30 minutes. If you did not request this, please ignore this email.</p>
    `);

    return sendEmail(email, 'Password Reset Request | True Threads', 'Reset your password.', html);
};

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendOrderUpdateEmail,
    sendPasswordResetEmail,
};
