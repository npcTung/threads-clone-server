module.exports = ({ user, otp }) => {
  return `
      <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>OTP Verification</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          h2 {
            color: #333;
          }
          .otp {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #4ea4dc;
            margin: 20px 0;
          }
          .message {
            color: #666;
            font-size: 16px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #aaa;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Xác minh OTP</h2>
          <p class="message">Kính gửi ${user},</p>
          <p class="message">
            Chúng tôi đã nhận được yêu cầu xác minh địa chỉ email của bạn. Vui lòng
            sử dụng OTP sau để hoàn tất quá trình xác minh của bạn:
          </p>

          <div class="otp">${otp}</div>
          <!-- Replace with dynamic OTP value -->

          <p class="message">Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>

          <p class="message">Thank you!</p>

          <div class="footer">
            <p>&copy; 2024 All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
