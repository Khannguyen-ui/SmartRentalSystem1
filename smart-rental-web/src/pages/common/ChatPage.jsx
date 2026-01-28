import React, { useState, useEffect, useRef } from 'react';
import {
  Layout, List, Avatar, Input, Button, Spin, Typography, Empty, Badge, message, Tooltip,
  Upload, Image, Dropdown, Modal, DatePicker, Form, Select
} from 'antd';
import {
  SendOutlined, UserOutlined, SearchOutlined, MoreOutlined, CheckCircleFilled,
  PictureOutlined, CalendarOutlined
} from '@ant-design/icons';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import dayjs from 'dayjs';

// Import hooks & services
import useAuth from '../../hooks/useAuth';
import chatService from '../../services/chatService';
import uploadService from '../../services/uploadService';
import roomService from '../../services/roomService'; // 🟢 Đã import roomService
import appointmentService from '../../services/appointmentService';

const { Sider, Content } = Layout;
const { Text } = Typography;
const { TextArea } = Input;

const ChatPage = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();

  // --- STATE ---
  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rooms, setRooms] = useState([]); // 🟢 State lưu danh sách phòng thật

  // --- STATE MODAL LỊCH HẸN ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingAppointment, setSubmittingAppointment] = useState(false);

  // --- REFS ---
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 1. KẾT NỐI WEBSOCKET
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = Stomp.over(socket);
    stompClient.debug = () => { };

    stompClient.connect({}, () => {
      if (isMounted && stompClient.connected) {
        setIsConnected(true);
        stompClient.subscribe(`/topic/user/${user.id}`, (payload) => {
          if (isMounted) {
            const newMessage = JSON.parse(payload.body);
            handleIncomingMessage(newMessage);
          }
        });
      }
    }, (err) => {
      if (isMounted) setIsConnected(false);
    });

    stompClientRef.current = stompClient;
    return () => {
      isMounted = false;
      if (stompClientRef.current?.connected) stompClientRef.current.disconnect();
    };
  }, [user]);

  // 2. LOAD DỮ LIỆU
  useEffect(() => {
    fetchConversations();
    fetchRooms(); // 🟢 Lấy dữ liệu phòng từ trang quản lý
  }, []);

  // 🟢 HÀM LẤY DANH SÁCH PHÒNG THẬT TỪ BACKEND
  const fetchRooms = async () => {
    try {
      const res = await roomService.getMyRooms();
      console.log("Dữ liệu phòng nhận được:", res.data); // Mở F12 để xem các thuộc tính
      setRooms(res.data || []);
    } catch (error) {
      message.error("Không thể tải danh sách phòng");
    }
  };
  useEffect(() => {
    if (selectedPartner) {
      setLoadingHistory(true);
      chatService.getChatHistory(selectedPartner.id)
        .then(res => setMessages(res.data || res || []))
        .catch(err => console.error(err))
        .finally(() => setLoadingHistory(false));
    }
  }, [selectedPartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await chatService.getConversations();
      setConversations(res.data || []);
    } catch (error) { setConversations([]); }
  };

  const filteredConversations = conversations.filter(item =>
    item.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🟢 XỬ LÝ TẠO LỊCH HẸN (GỌI SERVICE THẬT)
  // 🟢 Cập nhật hàm handleCreateAppointment trong ChatPage.jsx
  const handleCreateAppointment = async (values) => {
    if (!selectedPartner) return;
    setSubmittingAppointment(true);
    try {
      const appointmentData = {
        roomId: values.roomId,
        tenantId: selectedPartner.id, // 👈 THÊM DÒNG NÀY: Gửi ID của người đang chat
        meetTime: values.dateTime[0].format('YYYY-MM-DDTHH:mm:ss'),
        message: values.note || "Lịch hẹn được tạo bởi chủ trọ"
      };

      const res = await appointmentService.create(appointmentData);

      if (res) {
        // Logic gửi tin nhắn qua WebSocket và hiển thị UI giữ nguyên...
        const selectedRoom = rooms.find(r => r.id === values.roomId);
        const timeStr = values.dateTime[0].format('DD/MM/YYYY HH:mm');
        const chatContent = `📅 **LỊCH HẸN HỆ THỐNG**\n📌 ${values.title}\n📍 Phòng: ${selectedRoom?.title}\n⏰ ${timeStr}\n📝 ${values.note || 'Không có ghi chú'}`;

        stompClientRef.current.send("/app/chat", {}, JSON.stringify({
          senderId: user.id,
          receiverId: selectedPartner.id,
          content: chatContent,
          type: 'TEXT'
        }));

        setMessages(prev => [...prev, { content: chatContent, senderId: user.id, id: Date.now(), createdAt: new Date().toISOString() }]);
        message.success("Đã tạo lịch hẹn và lưu vào hệ thống!");
        setIsModalOpen(false);
        form.resetFields();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Lỗi kết nối hệ thống";
      message.error(errorMsg);
    } finally {
      setSubmittingAppointment(false);
    }
  };

  // --- LOGIC CHAT (Giữ nguyên) ---
  const handleIncomingMessage = (msg) => {
    if (selectedPartner && (msg.senderId === selectedPartner.id || msg.receiverId === selectedPartner.id)) {
      setMessages(prev => [...prev, msg]);
    }
    fetchConversations();
  };

  const handleImageUpload = async (info) => {
    const file = info.file;
    if (!selectedPartner || !isConnected) return;
    try {
      message.loading({ content: 'Đang gửi ảnh...', key: 'upload_chat' });
      const imageUrl = await uploadService.uploadImage(file);
      const chatMessageDTO = { senderId: user.id, receiverId: selectedPartner.id, content: imageUrl, type: 'IMAGE' };
      stompClientRef.current.send("/app/chat", {}, JSON.stringify(chatMessageDTO));
      setMessages(prev => [...prev, { ...chatMessageDTO, id: Date.now(), createdAt: new Date().toISOString() }]);
      message.success({ content: 'Đã gửi ảnh', key: 'upload_chat' });
    } catch (error) { message.error({ content: 'Lỗi gửi ảnh', key: 'upload_chat' }); }
  };

  const handleSend = () => {
    if (!inputText.trim() || !selectedPartner || !stompClientRef.current?.connected) return;
    const chatMessageDTO = { senderId: user.id, receiverId: selectedPartner.id, content: inputText, type: 'TEXT' };
    stompClientRef.current.send("/app/chat", {}, JSON.stringify(chatMessageDTO));
    setMessages(prev => [...prev, { ...chatMessageDTO, id: Date.now(), createdAt: new Date().toISOString() }]);
    setInputText('');
  };

  const menuItems = [
    {
      key: 'appointment',
      label: 'Tạo lịch hẹn hệ thống',
      icon: <CalendarOutlined />,
      onClick: () => setIsModalOpen(true),
    },
  ];

  return (
    <Layout className="h-[calc(100vh-80px)] bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm m-4">

      {/* SIDEBAR TRÁI */}
      <Sider width={240} theme="light" className="border-r border-gray-200 flex flex-col h-full">
        <div className="p-3 border-b bg-gray-50 flex items-center gap-2 flex-shrink-0">
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Tìm kiếm..."
            className="rounded-md flex-1 border-none bg-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
          <Tooltip title={isConnected ? "Đã kết nối" : "Mất kết nối"}>
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </Tooltip>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <List
            dataSource={filteredConversations}
            renderItem={item => (
              <div
                onClick={() => setSelectedPartner(item)}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-blue-50 transition border-b border-gray-50
                  ${selectedPartner?.id === item.id ? 'bg-blue-50 border-r-4 border-r-blue-600' : ''}`}
              >
                <Avatar size={40} src={item.avatar} icon={<UserOutlined />} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text strong className="truncate text-gray-800 block text-[14px]">{item.fullName}</Text>
                </div>
              </div>
            )}
          />
        </div>
      </Sider>

      {/* KHUNG CHAT PHẢI */}
      <Content className="flex flex-col bg-[#F5F7FB]">
        {selectedPartner ? (
          <>
            <div className="h-16 px-6 bg-white border-b flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar src={selectedPartner.avatar} icon={<UserOutlined />} />
                <div className="font-bold text-gray-800 text-base">{selectedPartner.fullName}</div>
              </div>

              <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                <Button icon={<MoreOutlined />} type="text" className="text-gray-500" />
              </Dropdown>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingHistory ? <div className="text-center mt-4"><Spin /></div> :
                messages.length === 0 ? <Empty description="Bắt đầu trò chuyện ngay!" className="mt-10" /> :
                  messages.map((msg, index) => {
                    const isMe = msg.senderId === user.id;
                    const isImage = msg.type === 'IMAGE';
                    return (
                      <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && <Avatar size="small" src={selectedPartner.avatar} className="mr-2 mt-auto mb-1" />}
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm relative whitespace-pre-wrap
                        ${isMe ? 'bg-[#E03C31] text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}
                        >
                          {isImage ? <Image src={msg.content} className="rounded-lg max-h-60 object-cover" /> : msg.content}
                          <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                            {dayjs(msg.createdAt).format('HH:mm')}
                            {isMe && <CheckCircleFilled className="ml-1 text-[10px]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
              }
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t flex items-center gap-2">
              <Upload customRequest={handleImageUpload} showUploadList={false} accept="image/*" disabled={!isConnected}>
                <Button icon={<PictureOutlined />} type="text" className="text-gray-500 hover:text-blue-500" />
              </Upload>
              <Input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onPressEnter={handleSend}
                placeholder={isConnected ? "Nhập tin nhắn..." : "Đang kết nối..."}
                disabled={!isConnected}
                className="rounded-full bg-gray-100 border-none h-10 px-4 flex-1"
              />
              <Button type="primary" shape="circle" size="large" icon={<SendOutlined />} onClick={handleSend}
                className="bg-[#E03C31] border-[#E03C31]" disabled={!isConnected} />
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
              <SendOutlined style={{ fontSize: 40, color: '#E03C31' }} />
            </div>
            <Text className="text-lg">Chọn một cuộc hội thoại để bắt đầu</Text>
          </div>
        )}
      </Content>

      {/* 🟢 MODAL TẠO LỊCH HẸN HỆ THỐNG */}
      <Modal
        title={<div className="text-[#E03C31]"><CalendarOutlined className="mr-2" /> Tạo lịch hẹn hệ thống</div>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submittingAppointment}
        okText="Xác nhận lưu lịch"
        cancelText="Hủy"
        okButtonProps={{ className: 'bg-[#E03C31] border-[#E03C31]' }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateAppointment} className="mt-4">
          <Form.Item
            name="title"
            label="Tiêu đề cuộc hẹn"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Ví dụ: Ký hợp đồng / Xem phòng thực tế" />
          </Form.Item>

          {/* Trong Modal tạo lịch hẹn */}
          <Form.Item
            name="roomId"
            label="Chọn phòng thực tế"
            rules={[{ required: true, message: 'Vui lòng chọn phòng!' }]}
          >
            <Select
              placeholder="Chọn phòng từ danh sách quản lý..."
              showSearch
              optionFilterProp="children"
            >
              {rooms.map(room => (
                <Select.Option key={room.id} value={room.id}>
                  {/* Backend dùng getTitle() nên ở đây dùng room.title */}
                  {room.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dateTime"
            label="Thời gian dự kiến (Bắt đầu - Kết thúc)"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
          >
            <DatePicker.RangePicker showTime format="DD/MM/YYYY HH:mm" className="w-full" />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú thêm">
            <TextArea rows={3} placeholder="Nội dung nhắc nhở khách hàng..." />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ChatPage;