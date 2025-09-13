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
    
    // Set up real-time updates
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Get today's sales and orders
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total, status')
        .gte('created_at', today);

      // Get total products
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('active', true);

      // Get recent orders with details
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            total,
            products (name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // build sequence map to convert UUID to simple increasing numbers
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id')
        .order('created_at', { ascending: true });

      const seqMap = new Map<string, number>();
      (allOrders || []).forEach((o: any, idx: number) => seqMap.set(o.id, idx + 1));

      const mapped = (orders || []).map((order: any) => ({
        ...order,
        order_number: seqMap.get(order.id) || 0,
        order_items: order.order_items?.map((it: any) => ({
          ...it,
          qty: it.quantity ?? it.qty,
          total_price: it.total ?? it.total_price,
        })),
      }));

      if (todayOrders) {
        const totalSales = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const activeOrdersCount = todayOrders.filter(order => order.status === 'aberto' || order.status === 'preparando').length;

        setStats({
          todaySales: todayOrders.length,
          totalOrders: todayOrders.length,
          activeOrders: activeOrdersCount,
          totalProducts: products?.length || 0,
          revenue: totalSales,
        });
      }

      setRecentOrders(mapped);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
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
              Receita do dia
            </p>
          </CardContent>
        </Card>

        <Card className="pdv-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
                        Pedido #{order.order_number || order.id}
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