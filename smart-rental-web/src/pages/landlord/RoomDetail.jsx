import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button, Card, Descriptions, Tag, Image, Row, Col, message, Carousel } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import roomService from '../../services/roomService';

const RoomDetail = () => {
  const { id } = useParams(); // Lấy ID từ URL
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRoomDetail = async () => {
      setLoading(true);
      try {
        // Gọi API lấy chi tiết phòng
        const res = await roomService.getRoomById(id);
        setRoom(res.data);
      } catch (error) {
        message.error("Không tìm thấy thông tin phòng!");
        navigate(-1); // Quay lại nếu lỗi
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRoomDetail();
  }, [id, navigate]);

  if (loading) return <div className="flex h-screen justify-center items-center"><Spin size="large" /></div>;
  if (!room) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Nút quay lại */}
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="mb-4">
        Quay lại
      </Button>

      <Row gutter={[24, 24]}>
        {/* Cột Trái: Hình ảnh */}
        <Col xs={24} lg={10}>
          <Card className="shadow-sm">
            {room.images && room.images.length > 0 ? (
              <Carousel autoplay effect="fade">
                {room.images.map((img, index) => (
                  <div key={index}>
                     <Image src={img} className="w-full h-64 object-cover rounded" />
                  </div>
                ))}
              </Carousel>
            ) : (
              <div className="h-64 bg-gray-200 flex items-center justify-center rounded">Không có ảnh</div>
            )}
            
            <div className="mt-4">
               <h3 className="font-bold mb-2">Tiện ích:</h3>
               <div className="flex flex-wrap gap-2">
                 {/* Giả sử amenities là mảng string */}
                 {room.amenities?.map((item, idx) => (
                    <Tag key={idx} color="blue" icon={<CheckCircleOutlined />}>{item}</Tag>
                 ))}
               </div>
            </div>
          </Card>
        </Col>

        {/* Cột Phải: Thông tin chi tiết */}
        <Col xs={24} lg={14}>
          <Card 
            title={<span className="text-xl font-bold text-blue-800">{room.title}</span>}
            extra={<Button type="primary" icon={<EditOutlined />}>Chỉnh sửa</Button>}
            className="shadow-sm"
          >
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Địa chỉ">{room.address}</Descriptions.Item>
              <Descriptions.Item label="Giá thuê">
                <span className="text-red-600 font-bold text-lg">
                  {room.price?.toLocaleString()} VND
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Tiền cọc">
                {room.deposit?.toLocaleString()} VND
              </Descriptions.Item>
              <Descriptions.Item label="Diện tích">{room.area} m²</Descriptions.Item>
              <Descriptions.Item label="Sức chứa">{room.capacity} người</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                 <Tag color={room.status === 'ACTIVE' ? 'green' : 'orange'}>
                   {room.status}
                 </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                <div className="whitespace-pre-line">{room.description}</div>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RoomDetail;