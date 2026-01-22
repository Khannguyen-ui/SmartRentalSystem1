import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, List, Avatar, Input, Tabs, Tag, Button, 
  Typography, Badge, Divider, Spin, message 
} from 'antd';
import { 
  SearchOutlined, SendOutlined, UserOutlined, 
  PhoneOutlined, HomeOutlined, CheckCircleOutlined, 
  ExclamationCircleOutlined, FileTextOutlined, MessageOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import contractService from '../../services/contractService';
import chatService from '../../services/chatService'; 
import useAuth from '../../hooks/useAuth'; // Giả sử bạn có hook lấy thông tin user

// --- IMPORT WEBSOCKET ---
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

const CustomerManagement = () => {
  const { user } = useAuth(); // Lấy thông tin người đang đăng nhập (Chủ trọ)
  
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  
  const [customers, setCustomers] = useState([]); 
  const [selectedTenantId, setSelectedTenantId] = useState(null); 
  const [activeTab, setActiveTab] = useState('active'); 
  
  const [chatHistory, setChatHistory] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  // --- REF CHO WEBSOCKET ---
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null); // Để auto scroll

  // 1. KẾT NỐI WEBSOCKET KHI VÀO TRANG
  // 1. KẾT NỐI WEBSOCKET KHI VÀO TRANG
  useEffect(() => {
    if (user && user.id) {
        connectWebSocket();
    }
    // Cleanup khi thoát trang
    return () => {
        if (stompClientRef.current) {
            // --- SỬA LỖI: Chỉ ngắt kết nối khi đã kết nối thành công ---
            if (stompClientRef.current.connected) {
                try {
                    stompClientRef.current.disconnect(() => {
                        console.log("❌ Đã ngắt kết nối WebSocket");
                    });
                } catch (error) {
                    console.warn("Lỗi ngắt kết nối:", error);
                }
            }
            // Nếu socket đang connecting (chưa xong), ta không gọi disconnect() 
            // để tránh lỗi InvalidStateError
            stompClientRef.current = null;
        }
    };
  }, [user]);

  // Hàm kết nối WS
  const connectWebSocket = () => {
      const socket = new SockJS('http://localhost:8080/ws');
      const stompClient = Stomp.over(socket);
      
      // --- THÊM DÒNG NÀY ĐỂ TẮT LOG DEBUG ---
      stompClient.debug = () => {}; 
      // --------------------------------------

      stompClient.connect({}, () => {
          // console.log("✅ Đã kết nối WebSocket!");
          
          stompClient.subscribe(`/topic/user/${user.id}`, (payload) => {
              const newMessage = JSON.parse(payload.body);
              handleIncomingMessage(newMessage);
          });

      }, (err) => {
          console.error("Lỗi kết nối WebSocket:", err);
          setTimeout(connectWebSocket, 5000);
      });

      stompClientRef.current = stompClient;
  };

  // Xử lý tin nhắn đến (Real-time)
  const handleIncomingMessage = (newMessage) => {
      // 1. Nếu tin nhắn thuộc về người đang chat -> Thêm vào list chat
      // (Lưu ý: State trong callback WS có thể bị cũ, nên dùng setChatHistory dạng callback)
      setChatHistory((prev) => {
          // Kiểm tra xem tin nhắn này có phải của người đang chọn không
          // newMessage.senderId phải bằng selectedTenantId
          // HOẶC newMessage.receiverId bằng selectedTenantId (trường hợp mình gửi đi từ thiết bị khác)
          
          // Tuy nhiên, logic ở đây ta check selectedTenantId hiện tại từ State ngoài
          // Cách an toàn hơn: Chỉ append nếu senderId trùng với ID khách đang mở
          
          // *Mẹo*: Do selectedTenantId trong closure này có thể null hoặc cũ,
          // ta sẽ update UI dựa trên logic renderMainContent bên dưới.
          // Nhưng để đơn giản, ta cứ add vào, React sẽ render lại.
          return [...prev, newMessage];
      });

      // 2. (Optional) Cập nhật lại danh sách khách hàng để đưa người vừa nhắn lên đầu
      // hoặc hiện chấm đỏ thông báo (cần logic phức tạp hơn chút ở state customers)
  };

  // 2. Load danh sách khách
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 3. Load lịch sử chat khi chọn khách
  useEffect(() => {
    if (selectedTenantId) {
        fetchChatHistory(selectedTenantId);
    }
  }, [selectedTenantId]);

  // 4. Auto scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await contractService.getLandlordCustomers();
      setCustomers(res || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (tenantId) => {
      setChatLoading(true);
      try {
          const res = await chatService.getChatHistory(tenantId);
          // Đảm bảo dữ liệu là mảng
          setChatHistory(Array.isArray(res) ? res : (res.data || [])); 
      } catch (error) {
          console.error("Lỗi tải tin nhắn:", error);
      } finally {
          setChatLoading(false);
      }
  };

  // --- GỬI TIN NHẮN QUA WEBSOCKET ---
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedTenantId || !user) return;

    const chatMessage = {
        senderId: user.id,
        receiverId: selectedTenantId,
        content: messageInput,
        type: 'TEXT'
    };

    // Gửi qua WebSocket
    if (stompClientRef.current) {
        try {
            // Backend Controller: @MessageMapping("/chat")
            stompClientRef.current.send("/app/chat", {}, JSON.stringify(chatMessage));
            
            // --- OPTIMISTIC UI UPDATE ---
            // Backend không gửi lại tin nhắn cho người gửi (trừ khi code backend có làm),
            // nên ta tự thêm tin nhắn của mình vào UI ngay lập tức cho mượt.
            const tempMsg = {
                ...chatMessage,
                id: Date.now(), // ID tạm
                createdAt: new Date().toISOString()
            };
            setChatHistory(prev => [...prev, tempMsg]);
            setMessageInput('');
            
        } catch (error) {
            message.error("Lỗi gửi tin nhắn (Socket)");
        }
    } else {
        message.error("Mất kết nối máy chủ chat. Vui lòng tải lại trang.");
    }
  };

  // ... (Phần logic lọc Tab và selectedCustomer giữ nguyên)
  const filteredList = customers.filter(c => {
    if (activeTab === 'active') return c.status === 'ACTIVE' || c.status === 'EXPIRED';
    if (activeTab === 'potential') return c.status === 'POTENTIAL' || c.status === 'PENDING';
    return true;
  });

  const selectedCustomer = customers.find(c => c.tenantId === selectedTenantId);

  // --- RENDER SIDEBAR (Giữ nguyên) ---
  const renderSidebar = () => (
    <div className="h-full flex flex-col border-r bg-white">
      <div className="p-4 border-b">
        <Input prefix={<SearchOutlined className="text-gray-400"/>} placeholder="Tìm khách hàng..." className="mb-4 rounded-full bg-gray-100 border-none" />
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="small"
          items={[
            { key: 'active', label: `Đang thuê (${customers.filter(c => c.status === 'ACTIVE').length})` },
            { key: 'potential', label: `Quan tâm` }
          ]} 
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <List
          itemLayout="horizontal"
          dataSource={filteredList}
          renderItem={(item) => (
            <div 
              onClick={() => setSelectedTenantId(item.tenantId)}
              className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 
                ${selectedTenantId === item.tenantId ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''}`}
            >
              <div className="flex gap-3">
                <Badge dot={item.status === 'ACTIVE'} color="green" offset={[-5, 30]}>
                   <Avatar size={48} src={item.tenantAvatar} icon={<UserOutlined />} />
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <Text strong className="truncate text-gray-800">{item.tenantName}</Text>
                    <Text type="secondary" className="text-xs">
                        {item.lastMessageTime ? dayjs(item.lastMessageTime).format('HH:mm') : ''}
                    </Text>
                  </div>
                  <Text type="secondary" className="text-xs truncate block mb-1">
                    <HomeOutlined className="mr-1"/> {item.roomTitle}
                  </Text>
                  <Text className="text-xs text-gray-500 truncate block">
                    {item.lastMessage || "Chạm để nhắn tin..."}
                  </Text>
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );

  // --- RENDER MAIN CONTENT ---
  const renderMainContent = () => {
    if (!selectedCustomer) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
           <div className="bg-white p-8 rounded-full shadow-sm mb-4"><MessageOutlined style={{ fontSize: 40 }} /></div>
           <p>Chọn một khách hàng để xem chi tiết & tin nhắn</p>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="h-16 bg-white border-b px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar src={selectedCustomer.tenantAvatar} icon={<UserOutlined />} />
            <div>
              <h3 className="font-bold text-gray-800 m-0">{selectedCustomer.tenantName}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <PhoneOutlined /> {selectedCustomer.tenantPhone || 'Chưa có SĐT'}
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <Tag color={selectedCustomer.status === 'ACTIVE' ? 'green' : 'orange'} className="m-0 border-none">
                  {selectedCustomer.status === 'ACTIVE' ? 'Đang thuê' : 'Quan tâm'}
                </Tag>
              </div>
            </div>
          </div>
          {selectedCustomer.status === 'ACTIVE' && (
              <Button icon={<FileTextOutlined />}>Hợp đồng</Button>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Cột Chat */}
          <div className="flex-1 flex flex-col relative">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
               {chatLoading ? <div className="text-center mt-5"><Spin /></div> : (
                   chatHistory.length === 0 ? <div className="text-center text-gray-400 mt-10">Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!</div> :
                   chatHistory
                    // Lọc: Chỉ hiển thị tin nhắn giữa User hiện tại và Tenant đang chọn
                    // (Đề phòng trường hợp nhận được tin socket của người khác khi đang mở người này)
                    .filter(msg => 
                        (msg.senderId === user.id && msg.receiverId === selectedTenantId) ||
                        (msg.senderId === selectedTenantId && msg.receiverId === user.id)
                    )
                    .map((msg, index) => {
                       const isMe = msg.senderId === user.id; 
                       
                       return (
                         <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && <Avatar size="small" src={selectedCustomer.tenantAvatar} icon={<UserOutlined/>} className="mr-2 mt-1"/>}
                            <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm 
                              ${isMe 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white text-gray-700 border border-gray-200 rounded-bl-none'}`}
                            >
                              {msg.content}
                              <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                {dayjs(msg.createdAt).format('HH:mm')}
                              </div>
                            </div>
                         </div>
                       );
                   })
               )}
               {/* Thẻ div rỗng để scroll xuống dưới cùng */}
               <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <Input 
                  placeholder="Nhập tin nhắn..." 
                  className="rounded-full bg-gray-100 border-none hover:bg-gray-200 focus:bg-white transition-all"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onPressEnter={handleSendMessage}
                />
                <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={handleSendMessage} className="bg-blue-600"/>
              </div>
            </div>
          </div>

          {/* Cột Thông tin (Bên phải) - Giữ nguyên code cũ của bạn */}
          <div className="w-[300px] bg-white border-l p-4 overflow-y-auto hidden xl:block">
             <Title level={5} className="mb-4 text-gray-700">Thông tin chi tiết</Title>
             
             {selectedCustomer.status === 'ACTIVE' ? (
               <div className="space-y-4">
                 <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-xs text-blue-500 font-bold uppercase mb-1">Phòng đang ở</div>
                    <div className="font-bold text-gray-800"><HomeOutlined /> {selectedCustomer.roomTitle}</div>
                 </div>

                 <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">Hợp đồng</div>
                    <div className="text-sm flex justify-between mb-1">
                      <span>Bắt đầu:</span> <span className="font-medium">{dayjs(selectedCustomer.startDate).format('DD/MM/YYYY')}</span>
                    </div>
                    <div className="text-sm flex justify-between">
                      <span>Kết thúc:</span> <span className="font-medium">{dayjs(selectedCustomer.endDate).format('DD/MM/YYYY')}</span>
                    </div>
                    <Divider className="my-2"/>
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircleOutlined /> Đã đóng cọc
                    </div>
                 </div>
               </div>
             ) : (
               <div className="space-y-4">
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="text-xs text-orange-500 font-bold uppercase mb-1">Quan tâm phòng</div>
                    <div className="font-bold text-gray-800"><HomeOutlined /> {selectedCustomer.roomTitle}</div>
                 </div>
                 
                 <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 font-bold uppercase mb-2">Trạng thái</div>
                    <div className="flex items-center gap-2 mb-2">
                      <ExclamationCircleOutlined className="text-orange-500"/> Chưa có hợp đồng
                    </div>
                    <Button size="small" type="primary" ghost block>Tạo lịch hẹn ngay</Button>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-white">
      <Layout className="h-full bg-white">
        <Sider width={320} theme="light" className="border-r shadow-lg z-10">
          {renderSidebar()}
        </Sider>
        <Content>
          {loading ? <div className="h-full flex justify-center items-center"><Spin size="large"/></div> : renderMainContent()}
        </Content>
      </Layout>
    </div>
  );
};

export default CustomerManagement;