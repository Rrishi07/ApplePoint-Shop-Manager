import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getToken } from './api'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Verify from './pages/Verify'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Accessories from './pages/Inventory'
import Stock from './pages/Stock'
import Sales from './pages/Sales'
import Repairs from './pages/Repairs'
import Reports from './pages/Reports'
import Backup from './pages/Backup'
import Settings from './pages/Settings'

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="accessories" element={<Accessories />} />
        <Route path="sales" element={<Sales />} />
        <Route path="inventory" element={<Stock />} />
        <Route path="repairs" element={<Repairs />} />
        <Route path="reports" element={<Reports />} />
        <Route path="backup" element={<Backup />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
