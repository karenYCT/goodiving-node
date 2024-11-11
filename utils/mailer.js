// mailer 模組 : 發送郵件的功能
import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

const { GMAIL_PASS, GMAIL_USER, EMAIL_USER } = process.env;

// 模擬 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sendMail = async (user_email, otp, otp_expiration_datetime) => {
  try {
    // 建立 transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
      },
    });

    // 設定模板路徑
    const templatePath = path.join(
      __dirname,
      "..",
      "views",
      "forgotpasswordemail.ejs"
    );
    console.log("Template Path:", templatePath); // 打印模板路徑

    // 渲染 EJS 模板
    const htmlContent = await ejs.renderFile(templatePath, {
      otp,
      otp_expiration_datetime,
    });

    const mailOptions = {
      from: EMAIL_USER, //寄件人email
      to: user_email, //收件人email
      subject: "【GooDiving】密碼重設驗證碼", //主旨
      html: htmlContent, // 信件內容
    };

    // 發送郵件
    const info = await transporter.sendMail(mailOptions);
    console.log("Email已寄出!![忘記密碼]");
  } catch (error) {
    console.log("Email發送失敗", error);
  }
};

export default sendMail;
