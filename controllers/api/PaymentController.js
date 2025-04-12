const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');
const { Package, Payment, Subscription, User } = require('../../models');
const mongoose = require('mongoose');


const VNP_TMN_CODE = process.env.VNP_TMN_CODE;
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET;
const VNP_URL = process.env.VNP_URL;
const VNP_RETURN_URL = process.env.VNP_RETURN_URL;
const FRONTEND_SUCCESS_URL = process.env.FRONTEND_SUCCESS_URL;
const FRONTEND_FAILED_URL = process.env.FRONTEND_FAILED_URL;


if (!VNP_TMN_CODE || !VNP_HASH_SECRET || !VNP_URL || !VNP_RETURN_URL || !FRONTEND_SUCCESS_URL || !FRONTEND_FAILED_URL) {
    console.error("LỖI NGHIÊM TRỌNG: Thiếu các biến môi trường VNPay hoặc URL Frontend bắt buộc. Kiểm tra file .env của bạn.");

}


const PaymentController = {

    async createVnpayPayment(req, res) {
        let payment = null;
        try {
            const { package_id } = req.params;
            const userId = req.user.id;

            if (!package_id || !mongoose.Types.ObjectId.isValid(package_id)) {
                return res.status(400).json({ success: false, message: 'ID gói không hợp lệ.' });
            }

            const packageDetails = await Package.findById(package_id);
            if (!packageDetails) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy gói.' });
            }


            payment = new Payment({
                user: userId,
                package: package_id,
                amount: packageDetails.price,
                currency: 'VND',
                payment_method: 'vnpay',
                payment_date: new Date(),
                status: 'pending',
                metadata: {
                    packageName: packageDetails.name,
                    packageDuration: packageDetails.duration_days
                }
            });
            await payment.save();


            const createDate = moment(new Date()).format('YYYYMMDDHHmmss');
            const orderId = `${createDate}_${payment._id}`;
            const amount = Math.round(packageDetails.price * 100);
            const orderInfo = `Thanh toan goi ${packageDetails.name} - PaymentID:${payment._id}`;
            const ipAddr = req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                (req.connection.socket ? req.connection.socket.remoteAddress : null);

            let vnp_Params = {
                'vnp_Version': '2.0.0',
                'vnp_Command': 'pay',
                'vnp_TmnCode': VNP_TMN_CODE,
                'vnp_Locale': 'vn',
                'vnp_CurrCode': 'VND',
                'vnp_TxnRef': orderId,
                'vnp_OrderInfo': orderInfo,
                'vnp_OrderType': 'billpayment',
                'vnp_Amount': amount,
                'vnp_ReturnUrl': VNP_RETURN_URL,
                'vnp_IpAddr': ipAddr?.replace('::ffff:', '') || '127.0.0.1',
                'vnp_CreateDate': createDate,
            };

            if (req.body.bank_code && req.body.bank_code !== '') {
                vnp_Params['vnp_BankCode'] = req.body.bank_code;
            } else {

                vnp_Params['vnp_BankCode'] = 'NCB';
            }


            const sortedParams = Object.keys(vnp_Params).sort().reduce((result, key) => {
                result[key] = vnp_Params[key];
                return result;
            }, {});
            const signData = qs.stringify(sortedParams, { encode: false });
            const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");


            vnp_Params['vnp_SecureHash'] = signed;


            const paymentUrl = VNP_URL + '?' + qs.stringify(vnp_Params, { encode: true });

            console.log("VNPay URL:", paymentUrl);

            res.status(200).json({
                success: true,
                message: 'URL thanh toán đã được tạo thành công.',
                code: '00',
                data: { url: paymentUrl }
            });

        } catch (error) {
            console.error("Lỗi tạo thanh toán VNPay:", error);

            if (payment && payment._id) {
                try {
                    await Payment.findByIdAndUpdate(payment._id, {
                        status: 'failed',
                        metadata: { ...payment.metadata, error: error.message }
                    });
                } catch (updateError) {
                    console.error("Lỗi cập nhật trạng thái thanh toán thành thất bại:", updateError);
                }
            }
            res.status(500).json({
                success: false,
                message: 'Tạo URL thanh toán thất bại: ' + error.message,
                error: error.message
            });
        }
    },


    async vnpayReturn(req, res) {
        try {
            let vnp_Params = req.query;
            const secureHash = vnp_Params['vnp_SecureHash'];


            console.log("Dữ liệu trả về thô từ VNPay:", req.query);


            const receivedSecureHash = req.query.vnp_SecureHash;


            const originalUrl = req.originalUrl;
            const queryStartIndex = originalUrl.indexOf('?');
            const rawQueryString = queryStartIndex !== -1 ? originalUrl.substring(queryStartIndex + 1) : '';

            console.log("Chuỗi query thô nhận được:", rawQueryString);


            const rawParams = {};
            if (rawQueryString) {
                rawQueryString.split('&').forEach(pair => {
                    const parts = pair.split('=');
                    if (parts.length === 2) {

                        rawParams[parts[0]] = parts[1];
                    } else if (parts.length === 1 && parts[0]) {

                        rawParams[parts[0]] = '';
                    }
                });
            }


            delete rawParams['vnp_SecureHash'];
            delete rawParams['vnp_SecureHashType'];


            const sortedRawKeys = Object.keys(rawParams).sort();


            let signData = '';
            for (const key of sortedRawKeys) {
                if (signData.length > 0) {
                    signData += '&';
                }
                signData += `${key}=${rawParams[key]}`;
            }


            console.log("Chuỗi được sử dụng để tính hash (từ query thô):", signData);

            const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
            const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");


            console.log("--- Xác thực chữ ký VNPay ---");
            console.log("vnp_SecureHash nhận được:", receivedSecureHash);
            console.log("Secure Hash tính toán:", calculatedHash);
            console.log("Hash Secret đã sử dụng (5 ký tự đầu):", VNP_HASH_SECRET ? VNP_HASH_SECRET.substring(0, 5) + "..." : "CHƯA TẢI");
            console.log("Tham số thô đã sử dụng cho Hash (đã sắp xếp):", sortObject(rawParams));
            console.log("------------------------------------");

            if (receivedSecureHash !== calculatedHash) {
                console.error("LỖI: Chữ ký bảo mật VNPay không hợp lệ. Chữ ký không khớp.");

                console.error("Chi tiết không khớp Hash:", {
                    received: receivedSecureHash,
                    calculated: calculatedHash,
                    string_hashed: signData,
                    raw_params_used: sortObject(rawParams)
                });


                return res.redirect(`${FRONTEND_FAILED_URL}?error=InvalidSignature`);
            }



            const responseCode = vnp_Params['vnp_ResponseCode'];
            const orderInfo = vnp_Params['vnp_OrderInfo'];
            const txnRef = vnp_Params['vnp_TxnRef'];


            const paymentIdMatch = orderInfo.match(/PaymentID:([a-f0-9]{24})/i);
            const paymentId = paymentIdMatch ? paymentIdMatch[1] : null;

            if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
                console.error("Không thể trích xuất Payment ID hợp lệ từ vnp_OrderInfo:", orderInfo);

                return res.redirect(`${FRONTEND_FAILED_URL}?error=InvalidOrderInfo&txnRef=${txnRef}`);
            }

            console.log("Payment ID đã trích xuất:", paymentId);

            const payment = await Payment.findById(paymentId);

            if (!payment) {
                console.error(`Không tìm thấy thanh toán với ID: ${paymentId}, TxnRef: ${txnRef}`);

                return res.redirect(`${FRONTEND_FAILED_URL}?error=PaymentNotFound&txnRef=${txnRef}`);
            }


            if (payment.status === 'success' || payment.status === 'failed') {
                console.log(`Thanh toán ${paymentId} đã được xử lý với trạng thái: ${payment.status}`);
                const redirectUrl = payment.status === 'success'
                    ? `${FRONTEND_SUCCESS_URL}?paymentId=${payment._id}&subscriptionId=${payment.subscription || ''}`
                    : `${FRONTEND_FAILED_URL}?error=AlreadyProcessed&paymentId=${payment._id}`;
                return res.redirect(redirectUrl);
            }


            if (responseCode === '00') {
                console.log(`Thanh toán VNPay thành công cho Payment ID: ${paymentId}, TxnRef: ${txnRef}`);

                const packageDetails = await Package.findById(payment.package);
                if (!packageDetails) {
                    console.error(`Không tìm thấy gói cho thanh toán ${paymentId}, package ID: ${payment.package}`);

                    payment.status = 'failed';
                    payment.metadata = { ...payment.metadata, error: 'Không tìm thấy gói liên kết trong quá trình xử lý trả về.' };
                    payment.transaction_id = vnp_Params['vnp_TransactionNo'];
                    await payment.save();
                    return res.redirect(`${FRONTEND_FAILED_URL}?error=PackageNotFound&paymentId=${payment._id}`);
                }


                const now = new Date();
                const endDate = moment(now).add(packageDetails.duration_days, 'days').toDate();

                const subscription = await Subscription.findOneAndUpdate(
                    { user: payment.user, status: 'active' },
                    {
                        package: packageDetails._id,
                        start_date: now,
                        end_date: endDate,
                        status: 'active'
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );


                payment.status = 'success';
                payment.subscription = subscription._id;
                payment.transaction_id = vnp_Params['vnp_TransactionNo'];
                payment.metadata = { ...payment.metadata, vnpayResponse: vnp_Params };
                await payment.save();

                console.log(`Đăng ký ${subscription._id} đã được tạo/cập nhật cho người dùng ${payment.user}`);


                return res.redirect(`${FRONTEND_SUCCESS_URL}?paymentId=${payment._id}&subscriptionId=${subscription._id}`);

            } else {
                console.log(`Thanh toán VNPay thất bại/bị hủy cho Payment ID: ${paymentId}, TxnRef: ${txnRef}, ResponseCode: ${responseCode}`);
                payment.status = 'failed';
                payment.transaction_id = vnp_Params['vnp_TransactionNo'];
                payment.metadata = { ...payment.metadata, vnpayResponse: vnp_Params, error: `Mã phản hồi VNPay: ${responseCode}` };
                await payment.save();


                return res.redirect(`${FRONTEND_FAILED_URL}?error=${responseCode}&paymentId=${payment._id}`);
            }

        } catch (error) {
            console.error("Lỗi xử lý trả về VNPay:", error);

            const paymentIdMatch = req.query.vnp_OrderInfo?.match(/PaymentID:([a-f0-9]{24})/i);
            const paymentId = paymentIdMatch ? paymentIdMatch[1] : null;


            if (paymentId && mongoose.Types.ObjectId.isValid(paymentId)) {
                try {
                    await Payment.findByIdAndUpdate(paymentId, {
                        status: 'failed',
                        metadata: { error: 'Lỗi server trong quá trình xử lý trả về VNPay.', details: error.message, vnpayResponse: req.query }
                    }, { new: false });
                } catch (updateError) {
                    console.error(`Lỗi cập nhật trạng thái thanh toán ${paymentId} thành thất bại sau lỗi chính:`, updateError);
                }
            }

            return res.redirect(`${FRONTEND_FAILED_URL}?error=ServerError&paymentId=${paymentId || ''}`);
        }
    },


    async getPackages(req, res) {
        try {
            const packages = await Package.find({ is_active: true }).select('-movies -createdAt -updatedAt -__v');

            const transformedPackages = packages.map(pkg => ({
                id: pkg._id,
                name: pkg.name,
                description: pkg.description,
                price: pkg.price,
                duration_days: pkg.duration_days,
                features: pkg.features,
                is_popular: pkg.name.toLowerCase().includes('vip'),
            }));

            res.status(200).json({ success: true, data: transformedPackages });
        } catch (error) {
            console.error("Lỗi lấy danh sách gói:", error);
            res.status(500).json({ success: false, message: 'Lấy danh sách gói thất bại.', error: error.message });
        }
    },


    async getPaymentDetails(req, res) {
        try {
            const userId = req.user.id;
            const { paymentId } = req.params;

            if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
                return res.status(400).json({ success: false, message: 'ID Thanh toán không hợp lệ.' });
            }


            const payment = await Payment.findOne({ _id: paymentId, user: userId })
                .populate({
                    path: 'subscription',
                    select: 'package start_date end_date status',
                    populate: {
                        path: 'package',
                        select: 'name'
                    }
                })
                .populate('package', 'name')
                .select('-metadata.vnpayResponse');

            if (!payment) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán hoặc quyền truy cập bị từ chối.' });
            }


            const responseData = {
                id: payment._id,
                amount: payment.amount,
                currency: payment.currency,
                payment_method: payment.payment_method,
                payment_date: payment.payment_date,
                status: payment.status,
                transaction_id: payment.transaction_id,
                package_name: payment.package?.name || payment.subscription?.package?.name || 'N/A',
                subscription_details: payment.subscription ? {
                    id: payment.subscription._id,
                    start_date: payment.subscription.start_date,
                    end_date: payment.subscription.end_date,
                    status: payment.subscription.status,
                } : null,
                metadata: payment.metadata
            };


            res.status(200).json({ success: true, data: responseData });
        } catch (error) {
            console.error("Lỗi lấy chi tiết thanh toán:", error);
            res.status(500).json({ success: false, message: 'Lấy chi tiết thanh toán thất bại.', error: error.message });
        }
    }
};


function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();

    for (let i = 0; i < keys.length; i++) {
        sorted[keys[i]] = obj[keys[i]];
    }

    return sorted;
}

module.exports = PaymentController;
