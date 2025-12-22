import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// Import AuthProvider vừa tạo
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Bọc AuthProvider ở ngoài cùng */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)