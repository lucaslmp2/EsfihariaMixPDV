import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Truck,
  Eye,
  Edit,
  Trash2,
  Phone,
  User,
  MapPin,
} from "lucide-react";

const Pedidos = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    table_number: "",
    type: "balcao",
    status: "aberto",
    notes: "",
  });
  const { toast } = useToast();

  const statusOptions = [
    { value: "aberto", label: "Aberto", icon: Clock, color: "default" },
    { value: "preparando", label: "Preparando", icon: Package, color: "secondary" },
    { value: "pronto", label: "Pronto", icon: CheckCircle, color: "outline" },
    { value: "entregue", label: "Entregue", icon: CheckCircle, color: "secondary" },
  ];

  const typeOptions = [
    { value: "balcao", label: "Balcão" },
    { value: "delivery", label: "Delivery" },
    { value: "mesa", label: "Mesa" },
  ];

  useEffect(() => {
    loadOrders();
    loadProducts();
    
    // Set up real-time updates
    const channel = supabase
      .channel('orders-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            total,
            products (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Build a sequence map for orders based on created_at ascending
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders')
        .select('id')
        .order('created_at', { ascending: true });

      if (allOrdersError) throw allOrdersError;

      const seqMap = new Map<string, number>();
      (allOrders || []).forEach((o: any, idx: number) => seqMap.set(o.id, idx + 1));

      // map database column names to UI-friendly keys (qty, total_price) and add order_number
      const mapped = (data || []).map((order: any) => ({
        ...order,
        order_number: seqMap.get(order.id) || 0,
        order_items: order.order_items?.map((it: any) => ({
          ...it,
          qty: it.quantity ?? it.qty,
          total_price: it.total ?? it.total_price,
        })),
      }));

      setOrders(mapped);
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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar produtos",
        description: error.message,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido",
      });
      return;
    }

    setIsSaving(true);

    try {
      const total = orderItems.reduce((sum, item) => sum + item.total_price, 0);
      
      const orderData = {
        ...formData,
        total,
      };

      let orderId;
      if (editingOrder) {
        const { error: updateError } = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', editingOrder.id);
          
        if (updateError) throw updateError;
        orderId = editingOrder.id;
        
        // Delete existing order items
        await supabase
          .from('order_items')
          .delete()
          .eq('order_id', orderId);
      } else {
        const { data: orderResult, error: insertError } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();
          
        if (insertError) throw insertError;
        orderId = orderResult.id;
      }

      // Insert order items
      // map UI keys to DB column names (quantity, total)
      const itemsToInsert = orderItems.map(item => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.qty,
        unit_price: item.unit_price,
        // `total` is a generated column (quantity * unit_price) in the DB, do not send it
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: editingOrder ? "Pedido atualizado" : "Pedido criado",
        description: `Pedido ${editingOrder ? "atualizado" : "criado"} com sucesso`,
      });

      setDialogOpen(false);
      resetForm();
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

    if (!window.confirm("Tem certeza que deseja apagar este pedido? Esta ação não pode ser desfeita.")) {
      return;
    }

    setIsDeleting(true);
    try {
      // Chama a função do banco de dados para uma exclusão atômica
      const { error } = await supabase.rpc('delete_order', {
        order_id_to_delete: editingOrder.id,
      });

      if (error) throw error;

      toast({
        title: "Pedido apagado",
        description: "O pedido foi removido com sucesso.",
      });

      setDialogOpen(false);
      resetForm();
      loadOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao apagar pedido",
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      // Do not send `updated_at` field in case the column is not present in the DB schema
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Pedido marcado como ${statusOptions.find(s => s.value === newStatus)?.label}`,
      });

      loadOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: error.message,
      });
    }
  };

  const addOrderItem = (product: any) => {
    const existingItem = orderItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      setOrderItems(items => items.map(item => 
        item.product_id === product.id
          ? { ...item, qty: item.qty + 1, total_price: (item.qty + 1) * item.unit_price }
          : item
      ));
    } else {
      setOrderItems(items => [...items, {
        product_id: product.id,
        product_name: product.name,
        qty: 1,
        unit_price: product.price,
        total_price: product.price,
      }]);
    }
  };

  const removeOrderItem = (productId: number) => {
    setOrderItems(items => items.filter(item => item.product_id !== productId));
  };

  const updateItemQty = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeOrderItem(productId);
      return;
    }

    setOrderItems(items => items.map(item => 
      item.product_id === productId
        ? { ...item, qty: newQty, total_price: newQty * item.unit_price }
        : item
    ));
  };

  const resetForm = () => {
    setFormData({
      customer_name: "",
      customer_phone: "",
      table_number: "",
      type: "balcao",
      status: "aberto",
      notes: "",
    });
    setOrderItems([]);
    setEditingOrder(null);
  };

  const handleEditOrder = (order: any) => {
    // populate form with order data
    setEditingOrder(order);
    setFormData({
      customer_name: order.customer_name || "",
      customer_phone: order.customer_phone || "",
      table_number: order.table_number || "",
      type: order.type || "balcao",
      status: order.status || "aberto",
      notes: order.notes || "",
    });

    const items = order.order_items?.map((it: any) => ({
      product_id: it.product_id,
      product_name: it.products?.name || it.product_name || "",
      qty: it.qty ?? it.quantity ?? 1,
      unit_price: it.unit_price ?? 0,
      total_price: it.total_price ?? it.total ?? 0,
    })) || [];

    setOrderItems(items);
    setDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.icon : Clock;
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.color : "default";
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.includes(searchTerm) ||
      order.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === "todos" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie os pedidos da sua esfiharia
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="pdv-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOrder ? "Editar Pedido" : "Novo Pedido"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do pedido e adicione os produtos
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Nome do Cliente</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    className="pdv-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="customer_phone">Telefone</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                    className="pdv-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Tipo do Pedido</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({...formData, type: value})}
                  >
                    <SelectTrigger className="pdv-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="table_number">Mesa/Endereço</Label>
                  <Input
                    id="table_number"
                    value={formData.table_number}
                    onChange={(e) => setFormData({...formData, table_number: e.target.value})}
                    placeholder={formData.type === "mesa" ? "Número da mesa" : "Endereço de entrega"}
                    className="pdv-input"
                  />
                </div>
              </div>

              {/* Products Selection */}
              <div>
                <Label>Produtos</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                  {products.map((product) => (
                    <Button
                      key={product.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addOrderItem(product)}
                      className="h-auto p-2 text-left justify-start"
                    >
                      <div>
                        <div className="font-medium text-xs">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          R$ {product.price.toFixed(2)}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              {orderItems.length > 0 && (
                <div>
                  <Label>Itens do Pedido</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {orderItems.map((item) => (
                      <div key={item.product_id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <span className="font-medium text-sm">{item.product_name}</span>
                          <div className="text-xs text-muted-foreground">
                            R$ {item.unit_price.toFixed(2)} cada
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQty(item.product_id, item.qty - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm">{item.qty}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQty(item.product_id, item.qty + 1)}
                          >
                            +
                          </Button>
                        </div>
                        
                        <div className="text-sm font-medium">
                          R$ {item.total_price.toFixed(2)}
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOrderItem(item.product_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="text-right font-bold p-2 bg-primary/10 rounded-lg">
                      Total: R$ {orderItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="pdv-input"
                  rows={2}
                />
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <div>
                  {editingOrder && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteOrder}
                      disabled={isSaving || isDeleting}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleting ? "Apagando..." : "Apagar"}
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={isSaving || isDeleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving || isDeleting || orderItems.length === 0}
                    className="pdv-button-primary"
                  >
                    {isSaving ? "Salvando..." : editingOrder ? "Atualizar" : "Criar Pedido"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, telefone ou número do pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pdv-input"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 pdv-input">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status);
            return (
              <Card key={order.id} className="pdv-card" onDoubleClick={() => handleEditOrder(order)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-foreground">
                        <div className="flex items-center justify-between">
                          <span>Pedido #{order.order_number || order.id}</span>
                          <Button size="sm" variant="ghost" onClick={() => handleEditOrder(order)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getStatusColor(order.status) as any}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusOptions.find(s => s.value === order.status)?.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {typeOptions.find(t => t.value === order.type)?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Customer Info */}
                  {order.customer_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{order.customer_name}</span>
                    </div>
                  )}
                  
                  {order.customer_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{order.customer_phone}</span>
                    </div>
                  )}
                  
                  {order.table_number && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{order.table_number}</span>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Itens:</div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {order.order_items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-foreground">
                            {item.qty}x {item.products?.name}
                          </span>
                          <span className="text-muted-foreground">
                            R$ {(item.total_price || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-lg text-primary">
                      R$ {(order.total || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-1 pt-2">
                    {statusOptions.map((statusOption) => {
                      if (statusOption.value === order.status) return null;
                      
                      return (
                        <Button
                          key={statusOption.value}
                          variant="outline"
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, statusOption.value)}
                          className="flex-1 text-xs"
                        >
                          <statusOption.icon className="w-3 h-3 mr-1" />
                          {statusOption.label}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum pedido encontrado
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== "todos"
              ? "Tente ajustar os filtros de busca"
              : "Comece criando seu primeiro pedido"}
          </p>
          {!searchTerm && statusFilter === "todos" && (
            <Button onClick={() => setDialogOpen(true)} className="pdv-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Pedido
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Pedidos;