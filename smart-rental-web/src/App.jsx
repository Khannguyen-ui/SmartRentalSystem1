// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd'; // Import thêm AntApp
import AppRoutes from './routes/AppRoutes'; 
import ChatBox from './components/shared/ChatBox';

function App() {
  return (
    <ConfigProvider theme={{ token: { primaryColor: '#ea580c' } }}> {/* Thêm nếu bạn muốn chỉnh màu cam thương hiệu */}
      <AntApp>
        <BrowserRouter>
           <AppRoutes />
           <ChatBox />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;