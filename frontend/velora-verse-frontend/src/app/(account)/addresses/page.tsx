"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "@/lib/api/addresses";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { ApiError } from "@/lib/api/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoading } from "@/components/shared/loading-spinner";

import type { Address, AddressType } from "@/types/address";

interface AddressFormData {
  full_name: string;
  phone: string;
  address_type: AddressType;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

const emptyForm: AddressFormData = {
  full_name: "",
  phone: "",
  address_type: "Shipping",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  is_default: false,
};

export default function AddressesPage() {
  const { isLoading: authLoading } = useRequireAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetchAddresses();
  }, [authLoading]);

  async function fetchAddresses() {
    try {
      setLoading(true);
      const data = await getAddresses();
      setAddresses(data.addresses ?? data);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load addresses");
      }
    } finally {
      setLoading(false);
    }
  }

  function openAddDialog() {
    setEditingAddress(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(address: Address) {
    setEditingAddress(address);
    setForm({
      full_name: address.full_name,
      phone: address.phone,
      address_type: address.address_type,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country || "India",
      is_default: address.is_default,
    });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.full_name.trim() ||
      !form.phone.trim() ||
      !form.address_line_1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address_type: form.address_type,
        address_line_1: form.address_line_1.trim(),
        address_line_2: form.address_line_2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        country: form.country.trim() || "India",
        is_default: form.is_default,
      };

      if (editingAddress) {
        await updateAddress({ address_name: editingAddress.name, ...payload });
        toast.success("Address updated");
      } else {
        await addAddress(payload as Omit<Address, "name">);
        toast.success("Address added");
      }

      setDialogOpen(false);
      fetchAddresses();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save address");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(name: string) {
    setDeletingName(name);
    try {
      await deleteAddress(name);
      setAddresses((prev) => prev.filter((a) => a.name !== name));
      toast.success("Address deleted");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete address");
      }
    } finally {
      setDeletingName(null);
    }
  }

  if (authLoading || loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Addresses</h1>
          <p className="text-muted-foreground">
            Manage your shipping and billing addresses
          </p>
        </div>
        <Button onClick={openAddDialog} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-12 w-12" />}
          title="No addresses yet"
          description="Add a shipping or billing address to get started"
          actionLabel="Add Address"
          onAction={openAddDialog}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card
              key={address.name}
              className="rounded-2xl border-border/60 shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {address.full_name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="secondary"
                      className="rounded-full text-xs"
                    >
                      {address.address_type}
                    </Badge>
                    {!!address.is_default && (
                      <Badge className="rounded-full text-xs">Default</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <p>{address.address_line_1}</p>
                  {address.address_line_2 && <p>{address.address_line_2}</p>}
                  <p>
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                  <p>{address.country}</p>
                  <p className="pt-1">{address.phone}</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => openEditDialog(address)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => handleDelete(address.name)}
                    disabled={deletingName === address.name}
                  >
                    {deletingName === address.name ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Address Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? "Update the address details below"
                : "Fill in the details for your new address"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addr_full_name">Full Name *</Label>
                <Input
                  id="addr_full_name"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  placeholder="Recipient name"
                  disabled={isSaving}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addr_phone">Phone *</Label>
                <Input
                  id="addr_phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="Phone number"
                  disabled={isSaving}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr_type">Address Type *</Label>
              <Select
                value={form.address_type}
                onValueChange={(val: AddressType) =>
                  setForm((f) => ({ ...f, address_type: val }))
                }
                disabled={isSaving}
              >
                <SelectTrigger id="addr_type" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shipping">Shipping</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr_line1">Address Line 1 *</Label>
              <Input
                id="addr_line1"
                value={form.address_line_1}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address_line_1: e.target.value }))
                }
                placeholder="Street address"
                disabled={isSaving}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr_line2">Address Line 2</Label>
              <Input
                id="addr_line2"
                value={form.address_line_2}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address_line_2: e.target.value }))
                }
                placeholder="Apartment, suite, etc."
                disabled={isSaving}
                className="rounded-xl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addr_city">City *</Label>
                <Input
                  id="addr_city"
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="City"
                  disabled={isSaving}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addr_state">State *</Label>
                <Input
                  id="addr_state"
                  value={form.state}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, state: e.target.value }))
                  }
                  placeholder="State"
                  disabled={isSaving}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addr_pincode">Pincode *</Label>
                <Input
                  id="addr_pincode"
                  value={form.pincode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pincode: e.target.value }))
                  }
                  placeholder="PIN Code"
                  disabled={isSaving}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addr_country">Country</Label>
                <Input
                  id="addr_country"
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                  placeholder="Country"
                  disabled={isSaving}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="addr_default"
                checked={form.is_default}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, is_default: checked }))
                }
                disabled={isSaving}
              />
              <Label htmlFor="addr_default">Set as default address</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingAddress ? (
                  "Update Address"
                ) : (
                  "Add Address"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
