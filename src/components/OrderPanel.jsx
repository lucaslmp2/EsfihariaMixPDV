export default function OrderPanel({ order }) {
  return (
    <div className="border rounded p-3 bg-white shadow-sm">
      <div className="flex justify-between">
        <div className="font-semibold">Pedido #{order.id}</div>
        <div className="text-sm text-gray-600">R$ {order.total}</div>
      </div>
      <div className="text-xs text-gray-500">{order.type} • {order.status}</div>
    </div>
  )
}
