import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, List, Avatar, Input, Button, Spin, Typography, Empty, Badge, message , Tooltip
} from 'antd';
import { 
  SendOutlined, UserOutlined, SearchOutlined, MoreOutlined, CheckCircleFilled 
} from '@ant-design/icons';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import dayjs from 'dayjs';

// Import hooks & services
import useAuth from '../../hooks/useAuth';
import chatService from '../../services/chatService';

const { Sider, Content } = Layout;
const { Text } = Typography;

const ChatPage = () => {
  const { user } = useAuth();
  
  // --- STATE ---
  const [conversations, setConversations] = useState([]); 
  const [selectedPartner, setSelectedPartner] = useState(null); 
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // Trạng thái kết nối hiển thị UI

  // --- REFS ---
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null); 

  // ========================================================================
  // 1. KẾT NỐI WEBSOCKET (ĐÃ FIX LỖI INVALID STATE)
  // ========================================================================
  useEffect(() => {
    if (!user?.id) return;

    // Biến cờ để kiểm tra component còn tồn tại không
    let isMounted = true;

    const socket = new SockJS('http://localhost:8080/ws'); 
    const stompClient = Stomp.over(socket);
    
    stompClient.debug = () => {}; // Tắt log

    stompClient.connect({}, () => {
      // Chỉ thực hiện nếu component còn mounted và socket đã kết nối
      if (isMounted && stompClient.connected) {
        setIsConnected(true);
        console.log("✅ WebSocket Connected!");

        // Subscribe an toàn
        stompClient.subscribe(`/topic/user/${user.id}`, (payload) => {
          if (isMounted) {
            const newMessage = JSON.parse(payload.body);
            handleIncomingMessage(newMessage);
          }
        });
      }
    }, (err) => {
      if (isMounted) {
        console.error("❌ Socket error:", err);
        setIsConnected(false);
      }
    });

    stompClientRef.current = stompClient;

    // Cleanup function: Chạy khi component unmount hoặc user thay đổi
    return () => {
      isMounted = false;
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.disconnect(() => {
            console.log("WebSocket Disconnected");
        });
      }
    };
  }, [user]);

  // ========================================================================
  // 2. LOAD DỮ LIỆU
  // ========================================================================
  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      setLoadingHistory(true);
      chatService.getChatHistory(selectedPartner.id)
        .then(res => {
           setMessages(res.data || res || []);
        })
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
    } catch (error) {
      console.error("Lỗi lấy danh sách chat");
      // Fallback data nếu API lỗi hoặc chưa có
      setConversations([]);
    }
  };

  // ========================================================================
  // 3. XỬ LÝ GỬI & NHẬN
  // ========================================================================
  const handleIncomingMessage = (msg) => {
    // Nếu đang mở chat với người này -> thêm vào list
    if (selectedPartner && (msg.senderId === selectedPartner.id || msg.receiverId === selectedPartner.id)) {
      setMessages(prev => [...prev, msg]);
    }
    // Refresh sidebar để cập nhật tin mới nhất
    fetchConversations(); 
  };

  const handleSend = () => {
    if (!inputText.trim() || !selectedPartner) return;

    // KIỂM TRA KẾT NỐI TRƯỚC KHI GỬI
    if (!stompClientRef.current || !stompClientRef.current.connected) {
        message.error("Mất kết nối máy chủ. Vui lòng tải lại trang!");
        return;
    }

    const chatMessageDTO = {
      senderId: user.id,
      receiverId: selectedPartner.id,
      content: inputText,
      type: 'TEXT'
    };

    try {
      stompClientRef.current.send("/app/chat", {}, JSON.stringify(chatMessageDTO));

      // Optimistic Update
      const tempMsg = {
        ...chatMessageDTO,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMsg]);
      setInputText('');
      
      // Update sidebar manual (để mượt hơn đỡ chờ API)
      setConversations(prev => {
         const idx = prev.findIndex(c => c.id === selectedPartner.id);
         if (idx > -1) {
             const updated = { ...prev[idx], lastMessage: inputText, lastTime: new Date() };
             const newArr = [...prev];
             newArr.splice(idx, 1);
             return [updated, ...newArr];
         }
         return prev;
      });

    } catch (error) {
      console.error("Lỗi gửi tin:", error);
      message.error("Không thể gửi tin nhắn");
    }
  };

  // ========================================================================
  // 4. RENDER UI
  // ========================================================================
  return (
    <Layout className="h-[calc(100vh-80px)] bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm m-4">
      
      {/* SIDEBAR TRÁI */}
      <Sider width={320} theme="light" className="border-r border-gray-200">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
           <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm..." className="rounded-full flex-1 mr-2" />
           {/* Đèn tín hiệu kết nối */}
           <Tooltip title={isConnected ? "Đã kết nối máy chủ" : "Mất kết nối"}>
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
           </Tooltip>
        </div>
        <div className="overflow-y-auto h-full custom-scrollbar">
          <List
            dataSource={conversations}
            renderItem={item => (
              <div 
                onClick={() => setSelectedPartner(item)}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-blue-50 transition border-b border-gray-50
                  ${selectedPartner?.id === item.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''}`}
              >
                <Avatar size={48} src={item.avatar} icon={<UserOutlined />} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <Text strong className="truncate text-gray-800">{item.fullName}</Text>
                    <Text type="secondary" className="text-[10px]">
                        {item.lastTime ? dayjs(item.lastTime).format('HH:mm') : ''}
                    </Text>
                  </div>
                  <Text type="secondary" className="text-xs truncate block text-gray-500">
                    {item.lastMessage || '...'}
                  </Text>
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
            {/* Header */}
            <div className="h-16 px-6 bg-white border-b flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                 <Avatar src={selectedPartner.avatar} icon={<UserOutlined />} />
                 <div>
                    <div className="font-bold text-gray-800 text-base">{selectedPartner.fullName}</div>
                 </div>
              </div>
              <Button icon={<MoreOutlined />} type="text" />
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingHistory ? <div className="text-center mt-4"><Spin /></div> : 
                 messages.length === 0 ? <Empty description="Bắt đầu trò chuyện ngay!" className="mt-10"/> :
                 messages.map((msg, index) => {
                   const isMe = msg.senderId === user.id;
                   
                   return (
                     <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && <Avatar size="small" src={selectedPartner.avatar} className="mr-2 mt-auto mb-1"/>}
                        <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow-sm relative
                          ${isMe 
                            ? 'bg-[#E03C31] text-white rounded-br-none' 
                            : 'bg-white text-gray-800 rounded-bl-none border'}`}
                        >
                          {msg.content}
                          <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                            {dayjs(msg.createdAt).format('HH:mm')}
                            {isMe && <CheckCircleFilled className="ml-1 text-[10px]"/>}
                          </div>
                        </div>
                     </div>
                   );
                 })
              }
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t flex gap-2">
              <Input 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onPressEnter={handleSend}
                placeholder={isConnected ? "Nhập tin nhắn..." : "Đang kết nối..."}
                disabled={!isConnected}
                className="rounded-full bg-gray-100 border-none h-10 px-4"
              />
              <Button 
                type="primary" 
                shape="circle" 
                size="large" 
                icon={<SendOutlined />} 
                onClick={handleSend} 
                className="bg-[#E03C31] border-[#E03C31]"
                disabled={!isConnected}
              />
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
    </Layout>
  );
};

export default ChatPage;