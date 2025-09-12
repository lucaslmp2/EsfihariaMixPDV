import { supabase } from "../supabaseClient"

export async function listProducts() {
  const { data, error } = await supabase.from("products").select("*")
  if (error) throw error
  return data
}

export async function listOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("id, type, status, total, created_at")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function createOrder(payload) {
  const { data, error } = await supabase.from("orders").insert([payload])
  if (error) throw error
  return data
}

export async function getOpenCashBox() {
  const { data, error } = await supabase
    .from("cash_boxes")
    .select("*")
    .order("opened_at", { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0] ?? null
}
