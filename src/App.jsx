import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Products from "./pages/Product"
import Orders from "./pages/Orders"
import Register from "./pages/Register"
import Navbar from "./components/Navbar"
import Sidebar from "./components/Sidebar"

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
              <Route path="/products" element={<Products />} />
              <Route path="/orders" element={<Orders />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
