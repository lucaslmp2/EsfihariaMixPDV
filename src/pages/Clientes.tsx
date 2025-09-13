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
  Plus,
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
} from "lucide-react";

const Clientes = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let error;
      if (editingCustomer) {
        const { error: updateError } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingCustomer.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('customers')
          .insert([formData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingCustomer ? "Cliente atualizado" : "Cliente criado",
        description: `${formData.name} foi ${editingCustomer ? "atualizado" : "criado"} com sucesso`,
      });

      setDialogOpen(false);
      resetForm();
      loadCustomers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar cliente",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Cliente excluído",
        description: "Cliente removido com sucesso",
      });

      loadCustomers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir cliente",
        description: error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
    setEditingCustomer(null);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-xl"></div>
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
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes da sua esfiharia
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="pdv-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do cliente
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Cliente *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="pdv-input"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="pdv-input"
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="pdv-input"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="pdv-input"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="pdv-input min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 pdv-button-primary">
                  {loading ? "Salvando..." : editingCustomer ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes por nome, telefone ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pdv-input"
        />
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="pdv-card group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-foreground truncate">
                      {customer.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Cliente
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {customer.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Telefone
                      </span>
                      <span className="text-foreground text-sm">
                        {customer.phone}
                      </span>
                    </div>
                  )}

                  {customer.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        E-mail
                      </span>
                      <span className="text-foreground text-sm truncate">
                        {customer.email}
                      </span>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Endereço
                      </span>
                      <span className="text-foreground text-sm truncate">
                        {customer.address}
                      </span>
                    </div>
                  )}

                  {customer.notes && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Observações:</span>
                      <p className="mt-1 text-xs">{customer.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(customer)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum cliente encontrado
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "Tente ajustar os filtros de busca"
              : "Comece criando seu primeiro cliente"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setDialogOpen(true)} className="pdv-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Cliente
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Clientes;