import React, { useEffect, useState } from 'react';
import { 
  Form, Input, Button, message, Upload, Tabs, Avatar, Collapse, Typography, Modal 
} from 'antd';
import { 
  UserOutlined, CameraOutlined, PlusOutlined, 
  LockOutlined, RightOutlined
} from '@ant-design/icons';
import userService from '../../services/userService'; 
import uploadService from '../../services/uploadService';
import useAuth from '../../hooks/useAuth'; 
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const UserProfile = () => {
  const { user, refreshProfile } = useAuth(); 
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Load dữ liệu khi vào trang
  useEffect(() => {
    if (user) {
        setAvatarUrl(user.avatarUrl);
        form.setFieldsValue({
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            citizenId: user.citizenId // Tạm dùng trường này cho "Mã số thuế" nếu chưa có field riêng
        });
    }
  }, [user]);

  // --- XỬ LÝ UPLOAD ẢNH ---
  const handleUploadAvatar = async ({ file, onSuccess, onError }) => {
    try {
      const result = await uploadService.uploadImage(file);
      const newUrl = result?.url || result; 
      
      // Cập nhật State & DB ngay lập tức
      const urlWithTime = `${newUrl}?t=${Date.now()}`;
      setAvatarUrl(urlWithTime); 
      await userService.updateProfile({ avatarUrl: newUrl });
      
      refreshProfile(); 
      message.success("Cập nhật ảnh đại diện thành công!");
      onSuccess("Ok");
    } catch (error) {
      message.error("Lỗi upload ảnh.");
      onError(error);
    }
  };

  // --- XỬ LÝ CẬP NHẬT THÔNG TIN ---
  const handleUpdateInfo = async (values) => {
    setLoading(true);
    try {
      await userService.updateProfile({ 
          ...values, 
          avatarUrl: avatarUrl.split('?')[0] // Bỏ timestamp khi lưu
      });
      message.success("Lưu thay đổi thành công!");
      refreshProfile(); 
    } catch (error) {
      message.error("Cập nhật thất bại: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- XỬ LÝ ĐỔI MẬT KHẨU ---
  const handleChangePassword = async (values) => {
    // Vì chưa có API đổi mật khẩu trong code bạn gửi, 
    // đây là khung sườn để bạn gọi API sau này.
    if (values.newPassword !== values.confirmPassword) {
        return message.error("Mật khẩu nhập lại không khớp!");
    }
    
    message.loading("Đang xử lý...");
    setTimeout(() => {
        message.success("Đổi mật khẩu thành công (Mô phỏng)");
        passwordForm.resetFields();
    }, 1000);
    
    /* try {
        await userService.changePassword(values.currentPassword, values.newPassword);
        message.success("Đổi mật khẩu thành công!");
        passwordForm.resetFields();
    } catch (error) {
        message.error("Đổi mật khẩu thất bại");
    }
    */
  };

  // --- COMPONENT CON: TAB 1 - CHỈNH SỬA THÔNG TIN ---
  const EditInfoTab = () => (
    <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleUpdateInfo}
        className="max-w-3xl"
    >
      {/* 1. Thông tin cá nhân */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-2">Thông tin cá nhân</h3>
        
        {/* Avatar Upload Center */}
        <div className="flex justify-center mb-8">
            <Upload 
                showUploadList={false}
                customRequest={handleUploadAvatar}
            >
                <div className="relative group cursor-pointer">
                    <Avatar 
                        size={120} 
                        src={avatarUrl} 
                        icon={<UserOutlined />} 
                        className="border-4 border-white shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-white text-center">
                            <CameraOutlined className="text-2xl block" />
                            <span className="text-xs">Tải ảnh</span>
                        </div>
                    </div>
                </div>
            </Upload>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item label="Họ và tên" name="fullName" rules={[{ required: true }]}>
                <Input size="large" className="rounded-md" />
            </Form.Item>
            <Form.Item label="Mã số thuế cá nhân (CCCD)" name="citizenId">
                <Input size="large" className="rounded-md" placeholder="Nhập mã số thuế hoặc CCCD" />
            </Form.Item>
        </div>
      </div>

      {/* 2. Thông tin liên hệ */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-2">Thông tin liên hệ</h3>
        
        <Form.Item label="Số điện thoại chính" name="phone" rules={[{ required: true }]}>
            <Input size="large" className="bg-gray-50" readOnly /> 
            {/* Thường SĐT dùng để đăng nhập nên hạn chế sửa trực tiếp, hoặc cho sửa nếu API cho phép */}
        </Form.Item>

        <Button type="link" icon={<PlusOutlined />} className="text-red-500 hover:text-red-600 p-0 mb-4 font-medium">
            Thêm số điện thoại (1/5)
        </Button>

        <Form.Item label="Email" name="email">
            <Input size="large" disabled className="bg-gray-100 text-gray-500" />
        </Form.Item>
      </div>

      {/* Nút Submit */}
      <div className="flex justify-end mt-4">
        <Button 
            type="primary" 
            htmlType="submit" 
            size="large"
            loading={loading}
            className="bg-[#d32f2f] hover:bg-[#b71c1c] border-none font-medium px-8 h-10 rounded shadow-sm"
        >
            Lưu thay đổi
        </Button>
      </div>
    </Form>
  );

  // --- COMPONENT CON: TAB 2 - CÀI ĐẶT TÀI KHOẢN ---
  const AccountSettingsTab = () => (
    <div className="max-w-3xl">
       {/* 1. Đổi mật khẩu */}
       <div className="mb-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Đổi mật khẩu</h3>
          <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
             <Form.Item 
                label="Mật khẩu hiện tại" 
                name="currentPassword" 
                rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}
             >
                <Input.Password size="large" placeholder="********" />
             </Form.Item>
             
             <div className="flex justify-end -mt-6 mb-4">
                <a href="#" className="text-red-500 text-sm hover:underline">Bạn quên mật khẩu?</a>
             </div>

             <Form.Item 
                label="Mật khẩu mới" 
                name="newPassword"
                rules={[
                    { required: true, message: 'Nhập mật khẩu mới' },
                    { min: 6, message: 'Tối thiểu 6 ký tự' }
                ]}
             >
                <Input.Password size="large" />
             </Form.Item>

             <div className="flex items-end gap-4">
                 <div className="flex-1">
                    <Form.Item 
                        label="Nhập lại mật khẩu mới" 
                        name="confirmPassword"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Xác nhận mật khẩu' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Mật khẩu không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password size="large" />
                    </Form.Item>
                 </div>
                 <div className="mb-6">
                    <Button 
                        type="primary" 
                        htmlType="submit"
                        className="bg-[#d32f2f] hover:bg-[#b71c1c] border-none h-10 px-6 font-medium"
                    >
                        Lưu thay đổi
                    </Button>
                 </div>
             </div>

             <ul className="text-gray-400 text-sm list-disc pl-5 mt-2 space-y-1">
                <li>Mật khẩu tối thiểu 6 ký tự</li>
                <li>Chứa ít nhất 1 ký tự viết hoa</li>
                <li>Chứa ít nhất 1 ký tự số</li>
             </ul>
          </Form>
       </div>

       {/* 2. Các mục mở rộng (Collapse) */}
       <div className="border-t pt-4">
          <Collapse 
            ghost 
            expandIconPosition="end" 
            expandIcon={({ isActive }) => <RightOutlined rotate={isActive ? 90 : 0} />}
            className="site-collapse-custom-collapse"
          >
            <Panel header={<span className="font-semibold text-gray-800 text-base">Yêu cầu khóa tài khoản</span>} key="1">
              <div className="pl-4 pb-2">
                 <p className="text-gray-600 mb-2">Tạm thời vô hiệu hóa tài khoản của bạn. Các tin đăng sẽ bị ẩn.</p>
                 <Button danger>Khóa tài khoản</Button>
              </div>
            </Panel>
            <Panel header={<span className="font-semibold text-gray-800 text-base">Yêu cầu xóa tài khoản</span>} key="2">
              <div className="pl-4 pb-2">
                 <p className="text-gray-600 mb-2 text-sm">Hành động này không thể hoàn tác. Mọi dữ liệu sẽ bị xóa vĩnh viễn.</p>
                 <Button type="primary" danger>Xóa vĩnh viễn</Button>
              </div>
            </Panel>
          </Collapse>
       </div>
    </div>
  );

  // --- CẤU HÌNH TABS ---
  const items = [
    {
      key: '1',
      label: 'Chỉnh sửa thông tin',
      children: <EditInfoTab />,
    },
    {
      key: '2',
      label: 'Cài đặt tài khoản',
      children: <AccountSettingsTab />,
    },
    {
      key: '3',
      label: (
        <span className="flex items-center gap-1">
            Đăng ký Môi giới chuyên nghiệp <span className="bg-red-500 text-white text-[10px] px-1 rounded ml-1">Mới</span>
        </span>
      ),
      disabled: true, // Tạm thời disable như ảnh mẫu
    },
  ];

  return (
    <div className="bg-white min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý tài khoản</h1>
        
        <Tabs 
            defaultActiveKey="1" 
            items={items} 
            size="large"
            tabBarStyle={{ 
                borderBottom: '1px solid #f0f0f0', 
                marginBottom: '32px',
                fontWeight: 500
            }}
        />
      </div>
    </div>
  );
};

export default UserProfile;