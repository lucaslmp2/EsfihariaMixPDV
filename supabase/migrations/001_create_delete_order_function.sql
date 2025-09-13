
create or replace function public.delete_order(order_id_to_delete uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Because of "ON DELETE CASCADE" on the "order_items" table,
  -- we only need to delete from the "orders" table. The database will automatically
  -- delete the associated order items.
  delete from public.orders where id = order_id_to_delete;
end;
$$;
