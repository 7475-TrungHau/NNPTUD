const nodemailer = require('nodemailer');

console.log('Mail config:', {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD ? '****' : undefined
});

// Tạo transporter object sử dụng SMTP transport
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true cho 465, false cho các cổng khác
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false // chỉ dùng trong môi trường phát triển
    }
});

/**
 * Gửi email
 * @param {string} to Địa chỉ email người nhận
 * @param {string} subject Chủ đề email
 * @param {string} text Nội dung email dạng text
 * @param {string} html Nội dung email dạng HTML
 */
const sendEmail = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: `"${process.env.MAIL_FROM_NAME || 'Movie App'}" <${process.env.MAIL_FROM_ADDRESS}>`, // Tên người gửi và địa chỉ
            to: to,
            subject: subject,
            text: text,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Không thể gửi email. Vui lòng thử lại sau.' + error.message);
    }
};

module.exports = { sendEmail };
