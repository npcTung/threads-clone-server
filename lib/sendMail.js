const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

module.exports = asyncHandler(async ({ email, html, subject }) => {
  let transorter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_NAME,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  let info = await transorter.sendMail({
    from: '"SocialMediaApp" <noreply@email.exampel.com>',
    to: email,
    subject,
    html,
  });

  return info;
});
