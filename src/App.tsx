import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import NativeBackHandler from './components/NativeBackHandler'
import { AuthProvider } from './components/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Create from './pages/Create'
import Detail from './pages/Detail'
import Home from './pages/Home'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Register from './pages/Register'

function CreateScreen() {
  const { pathname } = useLocation()
  return <Create key={pathname} />
}

function AppRoutes() {
  return (
    <div className="app-shell">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Private Routes */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateScreen /></ProtectedRoute>} />
        <Route path="/transaction/:id/edit" element={<ProtectedRoute><CreateScreen /></ProtectedRoute>} />
        <Route path="/transaction/:id" element={<ProtectedRoute><Detail /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NativeBackHandler />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
