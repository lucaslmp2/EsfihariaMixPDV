import React, { useState, useEffect, useMemo } from "react";

import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Plus,
  Search,
  Clock,
  CheckCircle,
  Package,
  CreditCard,
  Edit,
  Trash2,
  Phone,
  User,
  MapPin,
} from "lucide-react";

const Pedidos = () => {
  const [orders, setOrders] = useState<any[]>([]);

  const [products, setProducts] = useState<any[]>([]);

  const [customers, setCustomers] = useState<any[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("todos");

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    customer_name: "",
    customer_phone: "",
    table_number: "",
    type: "balcao",
    status: "aberto",
    notes: "",
  });

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setFormData({
      customer_name: order.customer_name || "",
      customer_phone: order.customer_phone || "",
      table_number: order.table_number || "",
      type: order.type || "balcao",
      status: order.status || "aberto",
      notes: order.notes || "",
    });
    setOrderItems(
      order.order_items.map((item: any) => ({ ...item, product_id: item.products.id }))
    );
    setSelectedCustomer({
      name: order.customer_name || "",
      phone: order.customer_phone || "",
    });
    setDialogOpen(true);
  };

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const [payingOrder, setPayingOrder] = useState<any>(null);

  const [paymentMethod, setPaymentMethod] = useState("dinheiro");

  const [amountReceived, setAmountReceived] = useState("");

  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState<boolean | null>(null);

  const { toast } = useToast();

  const statusOptions = [
    { value: "aberto", label: "Aberto", icon: Clock, color: "default" },

    {
      value: "preparando",
      label: "Preparando",
      icon: Package,
      color: "secondary",
    },

    { value: "pronto", label: "Pronto", icon: CheckCircle, color: "outline" },

    { value: "entregue", label: "Entregue", icon: CheckCircle, color: "secondary" },

    { value: "pago", label: "Pago", icon: CreditCard, color: "default" },
  ];

  const statusClasses: { [key: string]: string } = {
    aberto: "bg-blue-500 text-white",
    preparando: "bg-yellow-500 text-white",
    pronto: "bg-green-500 text-white",
    entregue: "bg-gray-500 text-white",
    pago: "bg-purple-500 text-white",
  };

  const typeOptions = [
    { value: "balcao", label: "Balcão" },

    { value: "delivery", label: "Delivery" },

    { value: "mesa", label: "Mesa" },
  ];

  const checkCashRegisterStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("cash_boxes")
        .select("id")
        .is("closed_at", null)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }
      setIsCashRegisterOpen(!!data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao verificar caixa",
        description: error.message,
      });
      setIsCashRegisterOpen(false);
    }
  };

  useEffect(() => {
    loadOrders();

    loadProducts();

    loadCustomers();

    checkCashRegisterStatus();

    const channel = supabase
      .channel("orders-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => loadOrders(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*, order_items(*, products(*))")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const formattedOrders = ordersData.map((order) => ({
        ...order,
        total: order.order_items.reduce(
          (acc, item) => acc + item.quantity * item.products.price,
          0
        ),
      }));

      setOrders(formattedOrders);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar pedidos",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("active", true);
      if (productsError) throw productsError;
      setProducts(productsData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar produtos",
        description: error.message,
      });
    }
  };

  const loadCustomers = async () => {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (customersError) throw customersError;
      setCustomers(customersData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: error.message,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (isCashRegisterOpen === false) {
      toast({
        variant: "destructive",
        title: "Caixa Fechado",
        description: "Não é possível criar pedidos com o caixa fechado. Abra um caixa antes de criar pedidos.",
      });
      setIsSaving(false);
      return;
    }

    const orderPayload: any = { ...formData };

    if (selectedCustomer) {
      orderPayload.customer_name = selectedCustomer.name;
      orderPayload.customer_phone = selectedCustomer.phone;
    } else {
      orderPayload.customer_name = formData.customer_name;
      orderPayload.customer_phone = formData.customer_phone;
    }

    if (orderPayload.type !== "mesa") {
      orderPayload.table_number = null;
    } else {
      orderPayload.table_number = parseInt(orderPayload.table_number, 10) || null;
    }

    const validOrderItems = orderItems.filter((item) => item.product_id);

    if (validOrderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Pedido sem itens",
        description: "Adicione pelo menos um item ao pedido.",
      });
      setIsSaving(false);
      return;
    }

    try {
      let orderId = editingOrder?.id;

      if (editingOrder) {
        const { data, error } = await supabase
          .from("orders")
          .update(orderPayload)
          .eq("id", editingOrder.id)
          .select()
          .single();

        if (error) throw error;
        orderId = data.id;
      } else {
        const { data, error } = await supabase
          .from("orders")
          .insert(orderPayload)
          .select()
          .single();

        if (error) throw error;
        orderId = data.id;
      } 

      const currentItems = editingOrder ? editingOrder.order_items.map((item: any) => item.id) : [];
      const newItems = validOrderItems.map((item) => item.id).filter((id) => id);

      const itemsToDelete = currentItems.filter((id: any) => !newItems.includes(id));
      if (itemsToDelete.length > 0) {
        const { error } = await supabase.from("order_items").delete().in("id", itemsToDelete);
        if (error) throw error;
      }

      const itemsToUpsert = validOrderItems.map((item) => {
        const upsertData: any = {
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
        };
        if (item.id) {
          upsertData.id = item.id;
        }
        return upsertData;
      });

      const { error: upsertError } = await supabase.from("order_items").upsert(itemsToUpsert);
      if (upsertError) throw upsertError;

      toast({
        title: editingOrder ? "Pedido Atualizado" : "Pedido Criado",
        description: `O pedido foi ${editingOrder ? "atualizado" : "criado"} com sucesso.`,
      });

      setDialogOpen(false);
      loadOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar pedido",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!editingOrder) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_order", {
        order_id_to_delete: editingOrder.id,
      });

      if (error) throw error;

      toast({
        title: "Pedido Excluído",
        description: "O pedido foi excluído com sucesso.",
      });

      setOrders(orders.filter((order) => order.id !== editingOrder.id));
      setDialogOpen(false);
      setEditingOrder(null);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir pedido",
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Status do Pedido Atualizado",
        description: `O status do pedido foi atualizado para ${newStatus}.`,
      });

      loadOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status do pedido",
        description: error.message,
      });
    }
  };

  const handleFinalizePayment = async () => {
    if (!payingOrder) return;

    setIsSaving(true);

    try {
      const { data: cashBox, error: cashBoxError } = await supabase
        .from("cash_boxes")
        .select("id")
        .is("closed_at", null)
        .single();

      if (cashBoxError || !cashBox) {
        toast({
          variant: "destructive",
          title: "Erro de Caixa",
          description:
            "Nenhum caixa aberto. Por favor, abra um caixa antes de finalizar o pagamento.",
        });

        throw new Error("Nenhum caixa aberto.");
      }

      const { error: movementError } = await supabase
        .from("cash_movements")
        .insert({
          cash_box_id: cashBox.id,
          amount: payingOrder.total,
          kind: 'entrada',
          notes: `Pagamento do Pedido #${payingOrder.order_number || payingOrder.id}`
        });

      if (movementError) throw movementError;

      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "pago", payment_method: paymentMethod })
        .eq("id", payingOrder.id);

      if (orderError) throw orderError;

      toast({
        title: "Pagamento Finalizado",
        description: `O pedido #${payingOrder.order_number || payingOrder.id} foi pago com sucesso.`,
      });

      setPaymentDialogOpen(false);
      setPayingOrder(null);
      loadOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao finalizar pagamento",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openPaymentDialog = (order: any) => {
    setPayingOrder(order);
    setAmountReceived("");
    setPaymentMethod("dinheiro");
    setPaymentDialogOpen(true);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm === "" ||
      (order.customer_name &&
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "todos" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter((customer) => {
    const term = customerSearchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(term) ||
      (customer.phone && customer.phone.toLowerCase().includes(term))
    );
  });

  const getStatusIcon = (status: string) => {
    const option = statusOptions.find((opt) => opt.value === status);
    return option?.icon || Clock;
  };

  const change = useMemo(() => {
    const total = payingOrder?.total || 0;
    const received = parseFloat(amountReceived) || 0;
    if (paymentMethod !== "dinheiro" || received <= total) {
      return 0;
    }
    return received - total;
  }, [payingOrder, amountReceived, paymentMethod]);

  const handleItemChange = (index: number, newProductId: string, newQuantity: string) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      product_id: newProductId,
      quantity: parseInt(newQuantity) || 1,
    };
    setOrderItems(updatedItems);
  };

  const addItem = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingOrder(null);
              setSelectedCustomer(null);
              setFormData({
                customer_name: "",
                customer_phone: "",
                table_number: "",
                type: "balcao",
                status: "aberto",
                notes: "",
              });
              setOrderItems([]);
              setDialogOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" /> Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingOrder ? `Editar Pedido #${editingOrder.order_number || editingOrder.id}` : "Novo Pedido"}</DialogTitle>
              <DialogDescription>
                {editingOrder
                  ? "Atualize as informações do pedido."
                  : "Preencha os detalhes para criar um novo pedido."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_select">Cliente</Label>
                  <Select
                    id="customer_select"
                    value={selectedCustomer ? selectedCustomer.id : ""}
                    onValueChange={(value) => {
                      const customer = customers.find(c => c.id === value);
                      setSelectedCustomer(customer || null);
                      if (customer) {
                        setFormData({
                          ...formData,
                          customer_name: customer.name,
                          customer_phone: customer.phone,
                        });
                      } else {
                        setFormData({
                          ...formData,
                          customer_name: "",
                          customer_phone: "",
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} {customer.phone ? `- ${customer.phone}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Nome do Cliente</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_name: e.target.value })
                    }
                    disabled={!!selectedCustomer}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Telefone</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_phone: e.target.value })
                    }
                    disabled={!!selectedCustomer}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.type === "mesa" && (
                  <div className="space-y-2">
                    <Label htmlFor="table_number">Número da Mesa</Label>
                    <Input
                      id="table_number"
                      value={formData.table_number}
                      onChange={(e) =>
                        setFormData({ ...formData, table_number: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Itens do Pedido</Label>
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={item.product_id}
                        onValueChange={(value) =>
                          handleItemChange(index, value, item.quantity.toString())
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="1"
                        className="w-20"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, item.product_id, e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Item
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                {editingOrder && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteOrder}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Excluindo..." : "Excluir Pedido"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (editingOrder ? "Atualizando..." : "Salvando...") : (editingOrder ? "Atualizar Pedido" : "Salvar Pedido")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Input
          placeholder="Buscar por nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          icon={<Search className="w-4 h-4 text-muted-foreground" />}
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p>Carregando pedidos...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status);
            return (
              <Card key={order.id} className="flex flex-col h-full">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">
                      Pedido #{order.order_number || order.id}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge className={`px-2 py-1 ${order.status === 'pago' ? 'bg-green-500 text-white' : (statusClasses[order.status] || 'bg-gray-500 text-white')}`}>
                    {order.status === 'pago' ? (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {order.payment_method === 'dinheiro' ? 'Dinheiro' :
                         order.payment_method === 'cartao_credito' ? 'Cartão Crédito' :
                         order.payment_method === 'cartao_debito' ? 'Cartão Débito' :
                         order.payment_method === 'pix' ? 'PIX' : 'Pago'}
                      </>
                    ) : (
                      <>
                        <StatusIcon className="w-4 h-4 mr-2" />
                        {statusOptions.find((s) => s.value === order.status)?.label}
                      </>
                    )}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <div className="font-semibold text-2xl">
                    R$ {order.total.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {order.customer_name && (
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-2" />
                        <span>{order.customer_name}</span>
                      </div>
                    )}
                    {order.customer_phone && (
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-2" />
                        <span>{order.customer_phone}</span>
                      </div>
                    )}
                    {order.type === "mesa" && order.table_number && (
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-2" />
                        <span>Mesa {order.table_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 pt-2 border-t">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span>
                          {item.quantity}x {item.products.name}
                        </span>
                        <span>
                          R$ {(item.quantity * item.products.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-2">
                    {order.status !== 'pago' && (
                        <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditOrder(order)}
                              className="flex-1 text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            {statusOptions.map((statusOption) => {
                              if (
                                statusOption.value === order.status ||
                                statusOption.value === "pago"
                              )
                                return null;
                              return (
                                <Button
                                  key={statusOption.value}
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateOrderStatus(order.id, statusOption.value)
                                  }
                                  className="flex-1 text-xs"
                                >
                                  <statusOption.icon className="w-3 h-3 mr-1" />
                                  {statusOption.label}
                                </Button>
                              );
                            })}
                            {(order.status === "pronto" ||
                              order.status === "entregue") && (
                              <Button
                                onClick={() => openPaymentDialog(order)}
                                size="sm"
                                className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white"
                              >
                                <CreditCard className="w-3 h-3 mr-1" />
                                Pagar
                              </Button>
                            )}
                        </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum pedido encontrado.
          </p>
        </div>
      )}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Pagamento</DialogTitle>
            <DialogDescription>
              Pedido #{payingOrder?.order_number || payingOrder?.id} - Total: R${" "}
              {(payingOrder?.total || 0).toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">
                    Cartão de Crédito
                  </SelectItem>
                  <SelectItem value="cartao_debito">
                    Cartão de Débito
                  </SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentMethod === "dinheiro" && (
              <div>
                <Label htmlFor="amountReceived">Valor Recebido</Label>
                <Input
                  id="amountReceived"
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            )}
            {change > 0 && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Troco</p>
                <p className="text-2xl font-bold">R$ {change.toFixed(2)}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleFinalizePayment} disabled={isSaving}>
              {isSaving ? "Finalizando..." : "Finalizar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pedidos;