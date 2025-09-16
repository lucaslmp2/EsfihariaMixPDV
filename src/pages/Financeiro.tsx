import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Target,
  FileText,
  Plus,
  Edit,
  Calendar,
  PieChart,
  LineChart,
  Save,
  X,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FixedCost {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  created_at: string;
  updated_at: string;
}

interface VariableCost {
  id: string;
  name: string;
  amount: number;
  date: string;
  created_at: string;
  updated_at: string;
}

const Financeiro = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Financial data states
  const [dailyAnalysis, setDailyAnalysis] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    balance: 0
  });

  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [variableCosts, setVariableCosts] = useState<VariableCost[]>([]);

  const [budgetGoals, setBudgetGoals] = useState({
    monthlyRevenue: 0.00,
    monthlyExpenses: 0.00,
    profitMargin: 0.0
  });

  const [dreData, setDreData] = useState({
    revenues: 0,
    costOfGoods: 0,
    operatingExpenses: 0,
    netProfit: 0
  });

  const [balanceData, setBalanceData] = useState({
    assets: {
      cash: 0,
      inventory: 0,
      equipment: 0,
      total: 0
    },
    liabilities: {
      loans: 0,
      suppliers: 0,
      total: 0
    },
    equity: 0
  });

  const [manualBalanceEntries, setManualBalanceEntries] = useState({
    equipment: 0,
    loans: 0
  });

  // Modal states
  const [fixedCostDialogOpen, setFixedCostDialogOpen] = useState(false);
  const [variableCostDialogOpen, setVariableCostDialogOpen] = useState(false);
  const [editingFixedCost, setEditingFixedCost] = useState<FixedCost | null>(null);
  const [editingVariableCost, setEditingVariableCost] = useState<VariableCost | null>(null);

  // Form states
  const [fixedCostForm, setFixedCostForm] = useState({
    name: '',
    amount: '',
    frequency: 'Mensal'
  });

  const [variableCostForm, setVariableCostForm] = useState({
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

      useEffect(() => {
        loadFinancialData();
        loadCosts();
      }, []);

      const loadFinancialData = async () => {
        setLoading(true);
        try {
          const today = new Date();
          const todayISO = today.toISOString().split('T')[0] + 'T00:00:00.000Z';
          const lastMonth = new Date();
          lastMonth.setDate(lastMonth.getDate() - 30);
          const lastMonthISO = lastMonth.toISOString();

          // Daily Analysis
          const { data: todayMovements, error: movementsError } = await supabase
            .from('cash_movements')
            .select('amount, kind')
            .gte('created_at', todayISO);

          if (movementsError) console.warn('Error fetching cash movements:', movementsError);

          let dailyRevenue = 0;
          let dailyExpenses = 0;

          (todayMovements || []).forEach(movement => {
            if (movement.kind === 'entrada') {
              dailyRevenue += movement.amount || 0;
            } else if (movement.kind === 'saida' || movement.kind === 'expense') {
              dailyExpenses += movement.amount || 0;
            }
          });

          const { data: cashBox, error: cashError } = await supabase
            .from('cash_boxes')
            .select('starting_amount')
            .is('closed_at', null)
            .order('opened_at', { ascending: false })
            .limit(1)
            .single();

          if (cashError) console.warn('Error fetching cash box:', cashError);

          setDailyAnalysis({
            revenue: dailyRevenue,
            expenses: dailyExpenses,
            profit: dailyRevenue - dailyExpenses,
            balance: cashBox?.starting_amount || 0
          });

          // DRE Data
          const { data: monthlyOrders, error: monthlyOrdersError } = await supabase
            .from('orders')
            .select('total, status')
            .gte('created_at', lastMonthISO);

          if (monthlyOrdersError) console.warn('Error fetching monthly orders:', monthlyOrdersError);

          const monthlyRevenue = (monthlyOrders || [])
            .filter(order => order.status?.toLowerCase() === 'pago' || order.status?.toLowerCase() === 'finalizado')
            .reduce((sum, order) => sum + (order.total || 0), 0);

          const { data: fixed, error: fixedError } = await supabase.from('fixed_costs').select('amount');
          if (fixedError) throw fixedError;
          const operatingExpenses = (fixed || []).reduce((sum, cost) => sum + cost.amount, 0);

          const { data: variable, error: variableError } = await supabase.from('variable_costs').select('amount').gte('date', lastMonthISO);
          if (variableError) throw variableError;
          const costOfGoods = (variable || []).reduce((sum, cost) => sum + cost.amount, 0);

          setDreData({
            revenues: monthlyRevenue,
            costOfGoods: costOfGoods,
            operatingExpenses: operatingExpenses,
            netProfit: monthlyRevenue - costOfGoods - operatingExpenses
          });

          // Manual Balance Sheet Entries
          const { data: manualEntries, error: manualEntriesError } = await supabase
            .from('balance_sheet_manual_entries')
            .select('*')
            .eq('id', '9b9e4e3c-9e9e-4e3c-9e9e-4e3c9e9e4e3c');

          if (manualEntriesError) throw manualEntriesError;

          let equipmentValue = 0;
          let loansValue = 0;

          if (manualEntries && manualEntries.length > 0) {
            equipmentValue = manualEntries[0].equipment;
            loansValue = manualEntries[0].loans;
            setManualBalanceEntries({
              equipment: equipmentValue,
              loans: loansValue
            });
          } else {
            const { data: newEntry, error: insertError } = await supabase
              .from('balance_sheet_manual_entries')
              .insert([{
                id: '9b9e4e3c-9e9e-4e3c-9e9e-4e3c9e9e4e3c',
                equipment: 8000.00,
                loans: 3000.00
              }]).select();
            if (insertError) throw insertError;
            if(newEntry) {
                equipmentValue = newEntry[0].equipment;
                loansValue = newEntry[0].loans;
            }
          }

          // Balance Data
          const { data: products, error: productsError } = await supabase.from('products').select('stock, cost_price');
          if (productsError) console.warn('Error fetching products:', productsError);
          const inventoryValue = (products || []).reduce((sum, p) => sum + (p.stock * p.cost_price), 0);

          const { data: unpaidEntries, error: entriesError } = await supabase.from('financial_entries').select('amount').eq('paid', false);
          if (entriesError) console.warn('Error fetching financial entries:', entriesError);
          const supplierDebt = (unpaidEntries || []).reduce((sum, e) => sum + e.amount, 0);

          const assetsTotal = (cashBox?.starting_amount || 0) + inventoryValue + equipmentValue;
          const liabilitiesTotal = supplierDebt + loansValue;

          setBalanceData({
            assets: {
              cash: cashBox?.starting_amount || 0,
              inventory: inventoryValue,
              equipment: equipmentValue,
              total: assetsTotal
            },
            liabilities: {
              suppliers: supplierDebt,
              loans: loansValue,
              total: liabilitiesTotal
            },
            equity: assetsTotal - liabilitiesTotal
          });

          // Budget Goals
          const { data: goals, error: goalsError } = await supabase
            .from('budget_goals')
            .select('*')
            .eq('id', '8a8e4e3c-8e8e-4e3c-8e8e-4e3c8e8e4e3c');

          if (goalsError) throw goalsError;

          if (goals && goals.length > 0) {
            setBudgetGoals({
              monthlyRevenue: goals[0].monthly_revenue,
              monthlyExpenses: goals[0].monthly_expenses,
              profitMargin: goals[0].profit_margin
            });
          } else {
            const { error: insertError } = await supabase
              .from('budget_goals')
              .insert([{
                id: '8a8e4e3c-8e8e-4e3c-8e8e-4e3c8e8e4e3c',
                monthly_revenue: 15000.00,
                monthly_expenses: 8000.00,
                profit_margin: 0.30
              }]);
            if (insertError) throw insertError;
          }

        } catch (error) {
          console.error('Error loading financial data:', error);
          toast({
            variant: "destructive",
            title: "Erro ao carregar dados financeiros",
            description: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        } finally {
          setLoading(false);
        }
      };

      const loadCosts = async () => {
        try {
          const { data: fixed, error: fixedError } = await supabase.from('fixed_costs').select('*');
          if (fixedError) throw fixedError;
          setFixedCosts(fixed || []);

          const { data: variable, error: variableError } = await supabase.from('variable_costs').select('*');
          if (variableError) throw variableError;
          setVariableCosts(variable || []);

        } catch (error) {
          console.error('Error loading costs:', error);
          toast({
            variant: "destructive",
            title: "Erro ao carregar custos",
            description: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      };

  const handleBudgetUpdate = async () => {
    try {
      const { error } = await supabase
        .from('budget_goals')
        .update({
          monthly_revenue: budgetGoals.monthlyRevenue,
          monthly_expenses: budgetGoals.monthlyExpenses,
          profit_margin: budgetGoals.profitMargin,
          updated_at: new Date().toISOString()
        })
        .eq('id', '8a8e4e3c-8e8e-4e3c-8e8e-4e3c8e8e4e3c');

      if (error) {
        console.error('Error updating budget goals:', error);
        throw error;
      }

      toast({
        title: "Metas atualizadas",
        description: "As metas de orçamento foram salvas com sucesso.",
      });
      loadFinancialData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar metas",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  const handleBalanceSheetUpdate = async () => {
    try {
      const { error } = await supabase
        .from('balance_sheet_manual_entries')
        .update({
          equipment: manualBalanceEntries.equipment,
          loans: manualBalanceEntries.loans,
          updated_at: new Date().toISOString()
        })
        .eq('id', '9b9e4e3c-9e9e-4e3c-9e9e-4e3c9e9e4e3c');

      if (error) {
        console.error('Error updating balance sheet:', error);
        throw error;
      }

      toast({
        title: "Balanço atualizado",
        description: "Os valores manuais do balanço foram salvos com sucesso.",
      });
      loadFinancialData(); // reload data to recalculate totals
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar balanço",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  const openFixedCostDialog = (cost?: FixedCost) => {
    if (cost) {
      setEditingFixedCost(cost);
      setFixedCostForm({
        name: cost.name,
        amount: cost.amount.toString(),
        frequency: cost.frequency
      });
    } else {
      setEditingFixedCost(null);
      setFixedCostForm({
        name: '',
        amount: '',
        frequency: 'Mensal'
      });
    }
    setFixedCostDialogOpen(true);
  };

  const openVariableCostDialog = (cost?: VariableCost) => {
    if (cost) {
      setEditingVariableCost(cost);
      setVariableCostForm({
        name: cost.name,
        amount: cost.amount.toString(),
        date: cost.date
      });
    } else {
      setEditingVariableCost(null);
      setVariableCostForm({
        name: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
    setVariableCostDialogOpen(true);
  };

  const saveFixedCost = async () => {
    try {
      const costData = {
        name: fixedCostForm.name,
        amount: parseFloat(fixedCostForm.amount),
        frequency: fixedCostForm.frequency,
      };

      if (editingFixedCost) {
        const { error } = await supabase.from('fixed_costs').update(costData).eq('id', editingFixedCost.id);
        if (error) throw error;
        toast({
          title: "Custo fixo atualizado",
          description: "O custo fixo foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase.from('fixed_costs').insert([costData]);
        if (error) throw error;
        toast({
          title: "Custo fixo adicionado",
          description: "O novo custo fixo foi adicionado com sucesso.",
        });
      }

      loadCosts();
      setFixedCostDialogOpen(false);
    } catch (error) {
      console.error('Error saving fixed cost:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar custo fixo",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  const saveVariableCost = async () => {
    try {
      const costData = {
        name: variableCostForm.name,
        amount: parseFloat(variableCostForm.amount),
        date: variableCostForm.date,
      };

      if (editingVariableCost) {
        const { error } = await supabase.from('variable_costs').update(costData).eq('id', editingVariableCost.id);
        if (error) throw error;
        toast({
          title: "Custo variável atualizado",
          description: "O custo variável foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase.from('variable_costs').insert([costData]);
        if (error) throw error;
        toast({
          title: "Custo variável adicionado",
          description: "O novo custo variável foi adicionado com sucesso.",
        });
      }

      loadCosts();
      setVariableCostDialogOpen(false);
    } catch (error) {
      console.error('Error saving variable cost:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar custo variável",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  const deleteFixedCost = async (id: string) => {
    try {
      const { error } = await supabase.from('fixed_costs').delete().eq('id', id);
      if (error) throw error;
      loadCosts();
      toast({
        title: "Custo fixo removido",
        description: "O custo fixo foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting fixed cost:', error);
      toast({
        variant: "destructive",
        title: "Erro ao remover custo fixo",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  const deleteVariableCost = async (id: string) => {
    try {
      const { error } = await supabase.from('variable_costs').delete().eq('id', id);
      if (error) throw error;
      loadCosts();
      toast({
        title: "Custo variável removido",
        description: "O custo variável foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting variable cost:', error);
      toast({
        variant: "destructive",
        title: "Erro ao remover custo variável",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="h-96 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Financeiro</h1>
        <p className="text-muted-foreground">Análise financeira e controle do negócio</p>
      </div>

      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Análise Diária
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Análise de Custos
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Orçamento
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Análise Diária */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="pdv-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita do Dia
                </CardTitle>
                <DollarSign className="w-5 h-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {dailyAnalysis.revenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Vendas realizadas hoje
                </p>
              </CardContent>
            </Card>

            <Card className="pdv-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Despesas do Dia
                </CardTitle>
                <DollarSign className="w-5 h-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {dailyAnalysis.expenses.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Gastos operacionais
                </p>
              </CardContent>
            </Card>

            <Card className="pdv-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lucro do Dia
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {dailyAnalysis.profit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita - Despesas
                </p>
              </CardContent>
            </Card>

            <Card className="pdv-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saldo Atual
                </CardTitle>
                <BarChart3 className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  R$ {dailyAnalysis.balance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Saúde financeira
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Análise de Custos */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="pdv-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Custos Fixos
                </CardTitle>
                <CardDescription>
                  Despesas que não variam com a produção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <Button onClick={() => openFixedCostDialog()} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Custo Fixo
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Frequência</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fixedCosts.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium">{cost.name}</TableCell>
                        <TableCell>R$ {cost.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{cost.frequency}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openFixedCostDialog(cost)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteFixedCost(cost.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Mensal:</span>
                    <span className="font-bold text-lg">
                      R$ {fixedCosts.reduce((sum, cost) => sum + cost.amount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="pdv-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Custos Variáveis
                </CardTitle>
                <CardDescription>
                  Gastos que mudam com a demanda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <Button onClick={() => openVariableCostDialog()} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Custo Variável
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variableCosts.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-medium">{cost.name}</TableCell>
                        <TableCell>R$ {cost.amount.toFixed(2)}</TableCell>
                        <TableCell>{new Date(cost.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openVariableCostDialog(cost)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteVariableCost(cost.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total do Período:</span>
                    <span className="font-bold text-lg">
                      R$ {variableCosts.reduce((sum, cost) => sum + cost.amount, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orçamento */}
        <TabsContent value="budget" className="space-y-6">
          <Card className="pdv-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Definição de Metas
              </CardTitle>
              <CardDescription>
                Estabeleça metas de faturamento e limites de gastos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRevenue">Meta de Faturamento Mensal</Label>
                  <Input
                    id="monthlyRevenue"
                    type="number"
                    value={budgetGoals.monthlyRevenue}
                    onChange={(e) => setBudgetGoals(prev => ({
                      ...prev,
                      monthlyRevenue: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyExpenses">Limite de Gastos Mensais</Label>
                  <Input
                    id="monthlyExpenses"
                    type="number"
                    value={budgetGoals.monthlyExpenses}
                    onChange={(e) => setBudgetGoals(prev => ({
                      ...prev,
                      monthlyExpenses: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profitMargin">Margem de Lucro Desejada (%)</Label>
                  <Input
                    id="profitMargin"
                    type="number"
                    value={(budgetGoals.profitMargin * 100).toFixed(1)}
                    onChange={(e) => setBudgetGoals(prev => ({
                      ...prev,
                      profitMargin: (parseFloat(e.target.value) || 0) / 100
                    }))}
                    placeholder="30.0"
                  />
                </div>
              </div>
              <Button onClick={handleBudgetUpdate} className="w-full md:w-auto">
                <Edit className="w-4 h-4 mr-2" />
                Salvar Metas
              </Button>
            </CardContent>
          </Card>

          <Card className="pdv-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Projeção Financeira
              </CardTitle>
              <CardDescription>
                Previsão de receitas e despesas futuras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    R$ {budgetGoals.monthlyRevenue.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">Receita Projetada</p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 mb-2">
                    R$ {budgetGoals.monthlyExpenses.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">Despesas Projetadas</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    R$ {(budgetGoals.monthlyRevenue * budgetGoals.profitMargin).toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">Lucro Projetado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatórios Financeiros */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="pdv-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  DRE - Demonstração do Resultado
                </CardTitle>
                <CardDescription>
                  Receitas vs Despesas (último mês)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Receitas</TableCell>
                      <TableCell className="text-right text-green-600">
                        + R$ {dreData.revenues.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Custo dos Produtos</TableCell>
                      <TableCell className="text-right text-red-600">
                        - R$ {dreData.costOfGoods.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Despesas Operacionais</TableCell>
                      <TableCell className="text-right text-red-600">
                        - R$ {dreData.operatingExpenses.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t-2">
                      <TableCell className="font-bold">Lucro Líquido</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        R$ {dreData.netProfit.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="pdv-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Balanço Patrimonial
                </CardTitle>
                <CardDescription>
                  Ativos, Passivos e Patrimônio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Ativos</h4>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>Dinheiro em Caixa</TableCell>
                          <TableCell className="text-right">R$ {balanceData.assets.cash.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Estoque</TableCell>
                          <TableCell className="text-right">R$ {balanceData.assets.inventory.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Equipamentos</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={manualBalanceEntries.equipment}
                              onChange={(e) => setManualBalanceEntries(prev => ({ ...prev, equipment: parseFloat(e.target.value) || 0 }))}
                              className="w-32 ml-auto"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-t font-semibold">
                          <TableCell>Total Ativos</TableCell>
                          <TableCell className="text-right">R$ {balanceData.assets.total.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Passivos</h4>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>Empréstimos</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={manualBalanceEntries.loans}
                              onChange={(e) => setManualBalanceEntries(prev => ({ ...prev, loans: parseFloat(e.target.value) || 0 }))}
                              className="w-32 ml-auto"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Fornecedores</TableCell>
                          <TableCell className="text-right">R$ {balanceData.liabilities.suppliers.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="border-t font-semibold">
                          <TableCell>Total Passivos</TableCell>
                          <TableCell className="text-right">R$ {balanceData.liabilities.total.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Patrimônio Líquido</span>
                      <span className="font-bold text-lg text-blue-600">
                        R$ {balanceData.equity.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button onClick={handleBalanceSheetUpdate} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Balanço
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Fixed Cost Dialog */}
      <Dialog open={fixedCostDialogOpen} onOpenChange={setFixedCostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFixedCost ? 'Editar Custo Fixo' : 'Adicionar Custo Fixo'}
            </DialogTitle>
            <DialogDescription>
              {editingFixedCost ? 'Atualize as informações do custo fixo.' : 'Adicione um novo custo fixo ao sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fixed-name">Nome do Custo</Label>
              <Input
                id="fixed-name"
                value={fixedCostForm.name}
                onChange={(e) => setFixedCostForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Aluguel, Energia, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fixed-amount">Valor (R$)</Label>
              <Input
                id="fixed-amount"
                type="number"
                step="0.01"
                value={fixedCostForm.amount}
                onChange={(e) => setFixedCostForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fixed-frequency">Frequência</Label>
              <Select
                value={fixedCostForm.frequency}
                onValueChange={(value) => setFixedCostForm(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diária">Diária</SelectItem>
                  <SelectItem value="Semanal">Semanal</SelectItem>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                  <SelectItem value="Anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFixedCostDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveFixedCost}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variable Cost Dialog */}
      <Dialog open={variableCostDialogOpen} onOpenChange={setVariableCostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVariableCost ? 'Editar Custo Variável' : 'Adicionar Custo Variável'}
            </DialogTitle>
            <DialogDescription>
              {editingVariableCost ? 'Atualize as informações do custo variável.' : 'Adicione um novo custo variável ao sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variable-name">Nome do Custo</Label>
              <Input
                id="variable-name"
                value={variableCostForm.name}
                onChange={(e) => setVariableCostForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Ingredientes, Embalagens, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variable-amount">Valor (R$)</Label>
              <Input
                id="variable-amount"
                type="number"
                step="0.01"
                value={variableCostForm.amount}
                onChange={(e) => setVariableCostForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="variable-date">Data</Label>
              <Input
                id="variable-date"
                type="date"
                value={variableCostForm.date}
                onChange={(e) => setVariableCostForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVariableCostDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveVariableCost}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financeiro;