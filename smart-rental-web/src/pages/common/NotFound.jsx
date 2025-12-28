import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Result
        status="404"
        title="404"
        subTitle="Xin lỗi, trang bạn tìm kiếm không tồn tại hoặc đã bị xóa."
        extra={
          <Button 
            type="primary" 
            size="large"
            className="bg-blue-600 hover:bg-blue-500"
            onClick={() => navigate('/')}
          >
            Về Trang Chủ
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;