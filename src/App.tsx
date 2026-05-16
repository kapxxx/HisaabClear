import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import NativeBackHandler from './components/NativeBackHandler'
import Create from './pages/Create'
import Detail from './pages/Detail'
import Home from './pages/Home'
import Splash from './pages/Splash'

function CreateScreen() {
  const { pathname } = useLocation()
  return <Create key={pathname} />
}

function AppRoutes() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/home" element={<Home />} />
        <Route path="/create" element={<CreateScreen />} />
        <Route path="/transaction/:id/edit" element={<CreateScreen />} />
        <Route path="/transaction/:id" element={<Detail />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <NativeBackHandler />
      <AppRoutes />
    </BrowserRouter>
  )
}
