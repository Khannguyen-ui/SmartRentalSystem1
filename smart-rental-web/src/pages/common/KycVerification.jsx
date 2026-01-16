import React, { useState, useEffect } from 'react';
import {
    Card, Form, Input, Button, Upload, message, Typography,
    Row, Col, Steps, Alert, Image, Spin
} from 'antd';
import {
    UploadOutlined, IdcardOutlined, CheckCircleOutlined,
    LoadingOutlined, ScanOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import userService from '../../services/userService';
import useAuth from '../../hooks/useAuth';

const { Title, Text } = Typography;
const { Step } = Steps;

const KycVerification = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // State
    const [loading, setLoading] = useState(false);
    const [ocrLoading, setOcrLoading] = useState(false); // Loading khi đang quét ảnh
    const [frontImage, setFrontImage] = useState(null);  // URL ảnh mặt trước
    const [backImage, setBackImage] = useState(null);    // URL ảnh mặt sau

    // Kiểm tra trạng thái User khi vào trang
    useEffect(() => {
        if (user?.kycStatus === 'VERIFIED') {
            message.success("Tài khoản của bạn đã được xác minh!");
        }
    }, [user]);

    // --- XỬ LÝ UPLOAD ẢNH MẶT TRƯỚC (CÓ OCR) ---
    const handleFrontUpload = async ({ file, onSuccess, onError }) => {
        setOcrLoading(true);
        try {
            // 1. Upload lên Cloudinary trước để lấy URL hiển thị
            const uploadRes = await userService.uploadFile(file);
            setFrontImage(uploadRes.data.url);

            // 2. Gọi API OCR để đọc chữ từ ảnh (Backend gọi FPT.AI/Tesseract)
            message.loading({ content: "Đang quét thông tin từ ảnh...", key: 'ocr' });

            try {
                const ocrRes = await userService.extractIdCard(file);

                // Tự động điền form
                form.setFieldsValue({
                    citizenId: ocrRes.data.citizenId,
                    fullName: ocrRes.data.fullName // Nếu Backend trả về tên
                });

                message.success({ content: "Đã trích xuất thông tin thành công!", key: 'ocr' });
            } catch (ocrError) {
                console.error("OCR Failed:", ocrError);
                message.warning({ content: "Không đọc được rõ thông tin. Vui lòng nhập tay.", key: 'ocr' });
            }

            onSuccess("ok");
        } catch (error) {
            console.error(error);
            onError(error);
            message.error("Lỗi khi tải ảnh lên.");
        } finally {
            setOcrLoading(false);
        }
    };

    // --- XỬ LÝ UPLOAD ẢNH MẶT SAU (KHÔNG CẦN OCR) ---
    const handleBackUpload = async ({ file, onSuccess, onError }) => {
        try {
            const res = await userService.uploadFile(file);
            setBackImage(res.data.url);
            onSuccess("ok");
        } catch (error) {
            onError(error);
            message.error("Lỗi upload ảnh mặt sau.");
        }
    };

    // --- GỬI FORM ---
    const onFinish = async (values) => {
        if (!frontImage || !backImage) {
            return message.error("Vui lòng tải lên đủ 2 mặt ảnh CCCD!");
        }

        setLoading(true);
        try {
            const payload = {
                citizenId: values.citizenId,
                citizenImages: [frontImage, backImage]
            };

            // 1. Gọi API Gửi hồ sơ
            await userService.submitKyc(payload);

            // 2. Nếu dòng trên không lỗi, chắc chắn là THÀNH CÔNG
            message.success("Gửi hồ sơ thành công! Vui lòng chờ duyệt.");

            // 3. Xử lý việc làm mới profile trong try-catch riêng
            // Để nếu nó có lỗi thì cũng không ảnh hưởng đến kết quả Gửi hồ sơ
            try {
                await refreshProfile();
            } catch (err) {
                console.log("Lỗi làm mới profile (không quan trọng):", err);
            }

            // 4. Chuyển trang
            navigate('/profile');

        } catch (error) {
            // 5. Chỉ khi API submitKyc lỗi thì mới hiện thông báo đỏ
            const errorMsg = error.response?.data?.message || "Gửi hồ sơ thất bại.";
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // --- GIAO DIỆN KHI ĐÃ VERIFIED HOẶC PENDING ---
    if (user?.kycStatus === 'VERIFIED') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <CheckCircleOutlined className="text-green-500 text-6xl mb-4" />
                <Title level={3}>Tài khoản đã được định danh</Title>
                <Text type="secondary">Bạn có thể sử dụng toàn bộ tính năng của hệ thống.</Text>
                <Button type="primary" className="mt-6" onClick={() => navigate('/')}>
                    Về trang chủ
                </Button>
            </div>
        );
    }

    if (user?.kycStatus === 'PENDING') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <LoadingOutlined className="text-blue-500 text-6xl mb-4" />
                <Title level={3}>Hồ sơ đang chờ duyệt</Title>
                <Text type="secondary" className="text-center max-w-md">
                    Admin đang kiểm tra thông tin của bạn. Quá trình này thường mất từ 1-24 giờ.
                    Vui lòng quay lại sau.
                </Text>
                <Button className="mt-6" onClick={() => navigate('/profile')}>
                    Quay về Hồ sơ
                </Button>
            </div>
        );
    }

    // --- GIAO DIỆN FORM CHÍNH ---
    return (
        <div className="max-w-3xl mx-auto p-6">
            <Card className="shadow-lg rounded-xl border-t-4 border-blue-600">
                <div className="text-center mb-8">
                    <Title level={2}>Xác Minh Danh Tính (eKYC)</Title>
                    <Text type="secondary">Sử dụng công nghệ AI để tự động nhận diện thông tin</Text>
                </div>

                {/* Thông báo nếu bị từ chối trước đó */}
                {user?.kycStatus === 'REJECTED' && (
                    <Alert
                        message="Yêu cầu trước đó bị từ chối"
                        description="Ảnh của bạn không rõ nét hoặc thông tin không khớp. Vui lòng thử lại."
                        type="error"
                        showIcon
                        className="mb-6"
                    />
                )}

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ fullName: user?.fullName }} // Điền sẵn tên từ profile nếu có
                >
                    <Row gutter={32}>
                        {/* Cột Trái: Upload Ảnh */}
                        <Col span={24} md={12}>
                            <Form.Item label="1. Ảnh mặt trước (Có AI quét)" required>
                                <Upload.Dragger
                                    customRequest={handleFrontUpload}
                                    showUploadList={false}
                                    accept="image/*"
                                    className="bg-gray-50"
                                >
                                    {frontImage ? (
                                        <div className="relative group">
                                            <Image src={frontImage} alt="Front" preview={false} className="max-h-48 object-contain rounded" />
                                            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white">
                                                Nhấn để thay đổi
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4">
                                            {ocrLoading ? <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} /> : <ScanOutlined className="text-3xl text-blue-500" />}
                                            <p className="ant-upload-text mt-2">Tải ảnh mặt trước</p>
                                            <p className="ant-upload-hint text-xs text-gray-400">Hệ thống sẽ tự động đọc số CCCD</p>
                                        </div>
                                    )}
                                </Upload.Dragger>
                            </Form.Item>

                            <Form.Item label="2. Ảnh mặt sau" required>
                                <Upload.Dragger
                                    customRequest={handleBackUpload}
                                    showUploadList={false}
                                    accept="image/*"
                                >
                                    {backImage ? (
                                        <Image src={backImage} alt="Back" preview={false} className="max-h-48 object-contain rounded" />
                                    ) : (
                                        <div className="p-4">
                                            <UploadOutlined className="text-3xl text-gray-400" />
                                            <p className="ant-upload-text mt-2">Tải ảnh mặt sau</p>
                                        </div>
                                    )}
                                </Upload.Dragger>
                            </Form.Item>
                        </Col>

                        {/* Cột Phải: Form thông tin */}
                        <Col span={24} md={12}>
                            <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                <h4 className="font-bold text-blue-800 mb-2 flex items-center">
                                    <IdcardOutlined className="mr-2" /> Thông tin trích xuất
                                </h4>
                                <Text className="text-xs text-gray-600">
                                    Thông tin dưới đây được AI đọc tự động. Vui lòng kiểm tra kỹ và chỉnh sửa nếu sai sót.
                                </Text>
                            </div>

                            <Form.Item
                                name="citizenId"
                                label="Số Căn cước công dân"
                                rules={[
                                    { required: true, message: "Vui lòng nhập số CCCD" },
                                    { pattern: /^[0-9]{9,12}$/, message: "Số CCCD không hợp lệ" }
                                ]}
                            >
                                <Input size="large" placeholder="Sẽ tự động điền..." />
                            </Form.Item>

                            <Form.Item
                                name="fullName"
                                label="Họ và Tên (Trên thẻ)"
                                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                            >
                                <Input size="large" placeholder="NGUYEN VAN A" />
                            </Form.Item>

                            <Alert
                                type="warning"
                                showIcon
                                messageApi="Lưu ý"
                                description="Việc sử dụng giấy tờ giả mạo sẽ dẫn đến việc khóa tài khoản vĩnh viễn."
                                className="mt-4"
                            />

                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                block
                                className="mt-6 h-12 text-lg font-bold bg-blue-600 hover:bg-blue-500"
                                loading={loading}
                                disabled={ocrLoading} // Không cho gửi khi đang quét
                            >
                                GỬI YÊU CẦU XÁC MINH
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Card>
        </div>
    );
};

export default KycVerification;