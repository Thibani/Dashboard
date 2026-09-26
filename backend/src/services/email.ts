import nodemailer from "nodemailer";

// smtp c'est l'équivalent du http mais pour les mails

export async function sendVerificationEmail(email: string, token: string) {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
    const res = await transporter.sendMail({
        from: "no-reply@dashboard.com",
        to: email,
        subject: "Account verification",
        text: `Click here to confirm your account: http://localhost:8080/api/auth/verify?token=${token}`
    });
    console.log("Preview URL:", nodemailer.getTestMessageUrl(res));
}