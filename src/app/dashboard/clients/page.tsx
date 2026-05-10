"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Store, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Client {
  id: string;
  name: string;
  storeUrl: string;
  storeName: string | null;
  contactEmail: string | null;
  apiConfigs?: { id: string }[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    storeUrl: "",
    storeName: "",
    contactEmail: "",
  });

  const fetchClients = () => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => {
        setClients(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Client created successfully");
        setFormData({ name: "", storeUrl: "", storeName: "", contactEmail: "" });
        setDialogOpen(false);
        fetchClients();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create client");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client? All configs will be deleted too.")) return;

    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Client deleted");
        fetchClients();
      } else {
        toast.error("Failed to delete client");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">Manage your Shopify client stores</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Add a new Shopify store to manage API configurations for
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeUrl">Store URL *</Label>
                <Input
                  id="storeUrl"
                  value={formData.storeUrl}
                  onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                  placeholder="acme.myshopify.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Display Name</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="Acme Store"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="admin@acme.com"
                />
              </div>
              <DialogFooter>
                <Button type="submit">Create Client</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Store className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No clients yet</p>
              <p className="text-sm mb-4">Add your first client to get started</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Store URL</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Configs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.name}
                      {client.storeName && client.storeName !== client.name && (
                        <p className="text-xs text-gray-500">{client.storeName}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://${client.storeUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                      >
                        {client.storeUrl}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>{client.contactEmail || "—"}</TableCell>
                    <TableCell>{client.apiConfigs?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/configs/new?clientId=${client.id}`}>
                          <Button variant="ghost" size="sm">
                            New Config
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
