import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Package,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalOrders: 0,
    activeOrders: 0,
    totalProducts: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    
    const ordersChannel = supabase
      .channel('dashboard-orders-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => loadDashboardData()
      )
      .subscribe();

    const movementsChannel = supabase
      .channel('dashboard-movements-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_movements' },
        () => loadDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(movementsChannel);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Get today's orders with items to calculate total
      const { data: todayOrders, error: todayOrdersError } = await supabase
        .from('orders')
        .select('status, order_items(quantity, products(price))')
        .gte('created_at', todayISO);

      if (todayOrdersError) throw todayOrdersError;

      // Get total products
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      if (productsError) throw productsError;

      // Get recent orders with details
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          customer_name,
          order_items (quantity, products(price, name))
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentOrdersError) throw recentOrdersError;

      const calculateOrderTotal = (order: any) => 
        order.order_items.reduce((acc: number, item: any) => acc + (item.quantity * item.products.price), 0);

      if (todayOrders) {
        const totalRevenue = todayOrders
          .filter(order => order.status === 'pago')
          .reduce((sum, order) => sum + calculateOrderTotal(order), 0);

        const activeOrdersCount = todayOrders.filter(order => order.status === 'aberto' || order.status === 'preparando').length;

        setStats({
          todaySales: todayOrders.length,
          totalOrders: todayOrders.length, // This seems redundant, maybe total orders all time?
          activeOrders: activeOrdersCount,
          totalProducts: productsCount || 0,
          revenue: totalRevenue,
        });
      }

      const mappedRecentOrders = (recentOrdersData || []).map((order: any) => ({
        ...order,
        total: calculateOrderTotal(order),
      }));

      setRecentOrders(mappedRecentOrders);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados do dashboard",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aberto':
        return <Clock className="w-4 h-4" />;
      case 'preparando':
        return <Package className="w-4 h-4" />;
      case 'pronto':
        return <CheckCircle className="w-4 h-4" />;
      case 'entregue':
        return <CheckCircle className="w-4 h-4" />;
      case 'pago':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'default';
      case 'preparando':
        return 'secondary';
      case 'pronto':
        return 'outline';
      case 'entregue':
        return 'secondary';
      case 'pago':
        return 'success'; // Assuming you have a success variant
      default:
        return 'destructive';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral das vendas de hoje</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="pdv-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas Hoje
            </CardTitle>
            <ShoppingCart className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.todaySales}</div>
            <p className="text-xs text-muted-foreground">
              Total de pedidos realizados
            </p>
          </CardContent>
        </Card>

        <Card className="pdv-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Ativos
            </CardTitle>
            <Clock className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              Em preparo ou aguardando
            </p>
          </CardContent>
        </Card>

        <Card className="pdv-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento
            </CardTitle>
            <DollarSign className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {stats.revenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita do dia (pedidos pagos)
            </p>
          </CardContent>
        </Card>

        <Card className="pdv-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-.2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produtos Ativos
            </CardTitle>
            <Package className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis para venda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="pdv-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="w-5 h-5" />
            Pedidos Recentes
          </CardTitle>
          <CardDescription>
            Últimos pedidos realizados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border transition-smooth hover:bg-muted"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="font-medium text-foreground">
                        Pedido #{order.id}
                      </span>
                    </div>
                    <Badge variant={getStatusColor(order.status) as any}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">
                      R$ {(order.total || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.customer_name || 'Cliente não informado'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pedido encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;