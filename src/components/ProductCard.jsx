export default function ProductCard({ product }) {
  return (
    <div className="border rounded p-3 bg-white shadow-sm">
      <div className="font-bold">{product.name}</div>
      <div className="text-sm text-gray-600">R$ {product.price}</div>
      <div className="text-xs text-gray-500">Estoque: {product.stock}</div>
    </div>
  )
}
