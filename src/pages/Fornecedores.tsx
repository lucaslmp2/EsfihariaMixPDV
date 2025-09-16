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
  Building,
} from "lucide-react";

const Fornecedores = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    trade_name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
    contact_person: "",
    payment_terms: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar fornecedores",
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado.");
      }

      let error;
      if (editingSupplier) {
        const { error: updateError } = await supabase
          .from('suppliers')
          .update(formData)
          .eq('id', editingSupplier.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('suppliers')
          .insert([{ ...formData, user_id: user.id }]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingSupplier ? "Fornecedor atualizado" : "Fornecedor criado",
        description: `${formData.name} foi ${editingSupplier ? "atualizado" : "criado"} com sucesso`,
      });

      setDialogOpen(false);
      resetForm();
      loadSuppliers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar fornecedor",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      trade_name: supplier.trade_name || "",
      cnpj: supplier.cnpj || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      contact_person: supplier.contact_person || "",
      payment_terms: supplier.payment_terms || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este fornecedor?")) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Fornecedor excluído",
        description: "Fornecedor removido com sucesso",
      });

      loadSuppliers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir fornecedor",
        description: error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      trade_name: "",
      cnpj: "",
      email: "",
      phone: "",
      address: "",
      contact_person: "",
      payment_terms: "",
    });
    setEditingSupplier(null);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(searchTermLower) ||
      (supplier.trade_name && supplier.trade_name.toLowerCase().includes(searchTermLower)) ||
      (supplier.cnpj && supplier.cnpj.includes(searchTerm)) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTermLower))
    );
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
          <h1 className="text-3xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie os fornecedores do seu negócio
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="pdv-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do fornecedor
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <div>
                  <Label htmlFor="name">Nome Fantasia *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="trade_name">Razão Social</Label>
                  <Input id="trade_name" value={formData.trade_name} onChange={(e) => setFormData({...formData, trade_name: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="contact_person">Pessoa de Contato</Label>
                  <Input id="contact_person" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="payment_terms">Condições de Pagamento</Label>
                  <Textarea id="payment_terms" value={formData.payment_terms} onChange={(e) => setFormData({...formData, payment_terms: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 pdv-button-primary">
                  {loading ? "Salvando..." : editingSupplier ? "Atualizar" : "Criar"}
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
          placeholder="Buscar fornecedores por nome, CNPJ ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Suppliers Grid */}
      {filteredSuppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-foreground truncate">
                      {supplier.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                        {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {supplier.trade_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        Razão Social
                      </span>
                      <span className="text-foreground text-sm truncate">
                        {supplier.trade_name}
                      </span>
                    </div>
                  )}
                  {supplier.cnpj && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        CNPJ
                      </span>
                      <span className="text-foreground text-sm">
                        {supplier.cnpj}
                      </span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Telefone
                      </span>
                      <span className="text-foreground text-sm">
                        {supplier.phone}
                      </span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        Email
                      </span>
                      <span className="text-foreground text-sm truncate">
                        {supplier.email}
                      </span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Endereço
                      </span>
                      <span className="text-foreground text-sm truncate">
                        {supplier.address}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(supplier)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(supplier.id)}
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
          <Building className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhum fornecedor encontrado
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "Tente ajustar os filtros de busca"
              : "Comece criando seu primeiro fornecedor"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setDialogOpen(true)} className="pdv-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Fornecedor
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Fornecedores;
