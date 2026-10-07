import nodemailer from "nodemailer";

// smtp c'est l'équivalent du http mais pour les mails

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
    const transporter = nodemailer.createTransport({
        host: "smtp.resend.com",
        port: 587,
        auth: {
            user: "resend",
            pass: process.env.RESEND_API_KEY,
        },
    });
    const res = await transporter.sendMail({
        from: 'onboarding@resend.dev',
        to: email,
        subject: "Account verification",
        text: `Click here to confirm your account: ${FRONTEND_URL}/verify?token=${token}`
    });
}