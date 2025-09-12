import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white p-4 flex items-center justify-between">
      <div className="font-bold">My POS</div>
      <div className="flex gap-4">
        <Link to="/products">Produtos</Link>
        <Link to="/orders">Pedidos</Link>
      </div>
    </nav>
  )
}
