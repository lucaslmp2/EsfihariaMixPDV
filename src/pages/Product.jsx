import { useEffect, useState } from "react"
import { listProducts } from "../lib/api"
import ProductCard from "../components/ProductCard"

export default function Products() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await listProducts()
        setProducts(data)
      } catch (err) {
        console.error(err)
      }
    }
    loadProducts()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Produtos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
