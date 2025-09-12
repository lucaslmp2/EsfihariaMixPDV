import { useEffect, useState } from "react"
import { listOrders } from "../lib/api"
import { supabase } from "../supabaseClient"
import OrderPanel from "../components/OrderPanel"

export default function Orders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await listOrders()
        setOrders(data)
      } catch (err) {
        console.error(err)
      }
    }

    loadOrders()

    // Escutar pedidos em tempo real
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Change received!", payload)
          loadOrders()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pedidos</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <OrderPanel key={o.id} order={o} />
        ))}
      </div>
    </div>
  )
}
