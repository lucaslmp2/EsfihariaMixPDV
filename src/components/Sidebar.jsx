import { Link } from "react-router-dom"

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r p-4">
      <h2 className="font-bold text-lg mb-4">PDV</h2>
      <nav className="flex flex-col gap-2">
        <Link className="text-blue-600" to="/products">
          Produtos
        </Link>
        <Link className="text-blue-600" to="/orders">
          Pedidos
        </Link>
      </nav>
    </aside>
  )
}
