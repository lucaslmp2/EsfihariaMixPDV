import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  Printer,
  XCircle,
  BookOpen,
  DollarSign,
} from "lucide-react";

const Caixa = () => {
  const [currentCaixa, setCurrentCaixa] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"open" | "movement" | "close">("open");
  const [movementType, setMovementType] = useState<"entrada" | "saida">("entrada");
  const [formValues, setFormValues] = useState({ amount: "", notes: "" });
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const fetchUserAndCaixa = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        checkCurrentCaixa(user.id);
      }
    };
    fetchUserAndCaixa();
  }, []);

  useEffect(() => {
    if (currentCaixa) {
      fetchMovements(currentCaixa.id);
      const channel = supabase
        .channel(`cash-movements-${currentCaixa.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "cash_movements", filter: `cash_box_id=eq.${currentCaixa.id}` },
          () => fetchMovements(currentCaixa.id)
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentCaixa]);

  const checkCurrentCaixa = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("cash_boxes")
        .select("*")
        .is("closed_at", null)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 = no rows found
        throw error;
      }
      setCurrentCaixa(data);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao verificar caixa", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMovements = async (caixaId: string) => {
    try {
      const { data, error } = await supabase
        .from("cash_movements")
        .select("*")
        .eq("cash_box_id", caixaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMovements(data || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao buscar movimentações", description: error.message });
    }
  };

  const handleOpenCaixa = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Erro", description: "Usuário não autenticado." });
      return;
    }
    setIsSubmitting(true);
    try {
      const amount = parseFloat(formValues.amount);
      if (isNaN(amount) || amount < 0) {
        toast({ variant: "destructive", title: "Valor inválido", description: "Insira um valor inicial válido." });
        return;
      }
      const { data, error } = await supabase
        .from("cash_boxes")
        .insert([{ starting_amount: amount, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      setCurrentCaixa(data);
      setDialogOpen(false);
      toast({ title: "Caixa Aberto", description: "O caixa foi aberto com sucesso." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao abrir caixa", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMovement = async () => {
    setIsSubmitting(true);
    try {
      const amount = parseFloat(formValues.amount);
      if (isNaN(amount) || amount <= 0) {
        toast({ variant: "destructive", title: "Valor inválido", description: "Insira um valor positivo." });
        return;
      }
      const { error } = await supabase.from("cash_movements").insert([
        {
          cash_box_id: currentCaixa.id,
          kind: movementType,
          amount,
          notes: formValues.notes,
        },
      ]);
      if (error) throw error;
      setDialogOpen(false);
      toast({ title: "Lançamento adicionado", description: "A movimentação foi registrada." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao adicionar lançamento", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMovement = async (movementId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
      const { error } = await supabase.from("cash_movements").delete().eq("id", movementId);
      if (error) throw error;
      toast({ title: "Lançamento excluído", description: "A movimentação foi removida." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    }
  };

  const handleCloseCaixa = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("cash_boxes")
        .update({ closed_at: new Date().toISOString() })
        .eq("id", currentCaixa.id);
      if (error) throw error;
      setCurrentCaixa(null);
      setMovements([]);
      setDialogOpen(false);
      toast({ title: "Caixa Fechado", description: "O caixa foi fechado com sucesso." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao fechar caixa", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    if (!currentCaixa) return { initial: 0, entries: 0, exits: 0, total: 0 };
    const entries = movements
      .filter((m) => m.kind === "entrada")
      .reduce((acc, m) => acc + m.amount, 0);
    const exits = movements
      .filter((m) => m.kind === "saida")
      .reduce((acc, m) => acc + m.amount, 0);
    const initial = currentCaixa.starting_amount;
    const total = initial + entries - exits;
    return { initial, entries, exits, total };
  }, [currentCaixa, movements]);

  const renderDialogContent = () => {
    // This content will be hidden during print by the .no-print class on its parent
    // ... (dialog content remains the same)
  };

  if (isLoading) {
    return <div className="p-6 no-print">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} className="no-print">
        <DialogContent>{renderDialogContent()}</DialogContent>
      </Dialog>

      {!currentCaixa ? (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg no-print">
          <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Nenhum caixa aberto</h2>
          <p className="text-muted-foreground mb-4">Abra um novo caixa para começar a registrar as movimentações.</p>
          <Button
            onClick={() => {
              setDialogMode("open");
              setFormValues({ amount: "", notes: "" });
              setDialogOpen(true);
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Abrir Caixa
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 no-print">
            <div>
              <h1 className="text-3xl font-bold">Gestão de Caixa</h1>
              <p className="text-muted-foreground">
                Caixa aberto em: {new Date(currentCaixa.opened_at).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogMode("movement");
                  setMovementType("saida");
                  setFormValues({ amount: "", notes: "" });
                  setDialogOpen(true);
                }}
              >
                <ArrowDownCircle className="mr-2 h-4 w-4" /> Nova Saída
              </Button>
              <Button
                onClick={() => {
                  setDialogMode("movement");
                  setMovementType("entrada");
                  setFormValues({ amount: "", notes: "" });
                  setDialogOpen(true);
                }}
              >
                <ArrowUpCircle className="mr-2 h-4 w-4" /> Nova Entrada
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 no-print">
            {/* ... cards ... */}
          </div>

          {/* Movements Table - This is the printable area */}
          <Card className="printable-area">
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right no-print">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length > 0 ? (
                    movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${m.kind === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                            {m.kind.charAt(0).toUpperCase() + m.kind.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>R$ {m.amount.toFixed(2)}</TableCell>
                        <TableCell>{m.notes}</TableCell>
                        <TableCell className="text-right no-print">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMovement(m.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        Nenhuma movimentação registrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 mt-6 no-print">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Histórico
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDialogMode("close");
                setDialogOpen(true);
              }}
            >
              <XCircle className="mr-2 h-4 w-4" /> Fechar Caixa
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Caixa;