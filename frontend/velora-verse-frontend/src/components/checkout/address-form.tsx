"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Address, AddressType } from "@/types/address";

interface AddressFormProps {
  initialData?: Partial<Address>;
  onSubmit: (address: Address) => void;
  onCancel?: () => void;
}

interface FormErrors {
  [key: string]: string;
}

export function AddressForm({ initialData, onSubmit, onCancel }: AddressFormProps) {
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name ?? "",
    phone: initialData?.phone ?? "",
    address_line_1: initialData?.address_line_1 ?? "",
    address_line_2: initialData?.address_line_2 ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    pincode: initialData?.pincode ?? "",
    country: initialData?.country ?? "India",
    address_type: (initialData?.address_type ?? "Shipping") as AddressType,
    is_default: initialData?.is_default ?? false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }
    if (!formData.address_line_1.trim()) {
      newErrors.address_line_1 = "Address is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!formData.pincode.trim()) {
      newErrors.pincode = "PIN code is required";
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = "Enter a valid 6-digit PIN code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: initialData?.name ?? "",
      user: initialData?.user ?? "",
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      address_type: formData.address_type,
      is_default: formData.is_default,
      address_line_1: formData.address_line_1.trim(),
      address_line_2: formData.address_line_2.trim() || undefined,
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      country: formData.country,
    } as Address);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => handleChange("full_name", e.target.value)}
          placeholder="John Doe"
        />
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="9876543210"
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone}</p>
        )}
      </div>

      {/* Address line 1 */}
      <div className="space-y-2">
        <Label htmlFor="address_line_1">Address Line 1 *</Label>
        <Input
          id="address_line_1"
          value={formData.address_line_1}
          onChange={(e) => handleChange("address_line_1", e.target.value)}
          placeholder="House/Flat No., Building, Street"
        />
        {errors.address_line_1 && (
          <p className="text-sm text-destructive">{errors.address_line_1}</p>
        )}
      </div>

      {/* Address line 2 */}
      <div className="space-y-2">
        <Label htmlFor="address_line_2">Address Line 2</Label>
        <Input
          id="address_line_2"
          value={formData.address_line_2}
          onChange={(e) => handleChange("address_line_2", e.target.value)}
          placeholder="Landmark, Area (optional)"
        />
      </div>

      {/* City and State */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Mumbai"
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleChange("state", e.target.value)}
            placeholder="Maharashtra"
          />
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state}</p>
          )}
        </div>
      </div>

      {/* Pincode and Country */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pincode">PIN Code *</Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => handleChange("pincode", e.target.value)}
            placeholder="400001"
          />
          {errors.pincode && (
            <p className="text-sm text-destructive">{errors.pincode}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => handleChange("country", e.target.value)}
            disabled
          />
        </div>
      </div>

      {/* Address type */}
      <div className="space-y-2">
        <Label>Address Type</Label>
        <Select
          value={formData.address_type}
          onValueChange={(value) => handleChange("address_type", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Shipping">Shipping</SelectItem>
            <SelectItem value="Billing">Billing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Default address checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="is_default"
          checked={formData.is_default}
          onCheckedChange={(checked) =>
            handleChange("is_default", checked === true)
          }
        />
        <Label htmlFor="is_default" className="cursor-pointer font-normal">
          Set as default address
        </Label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit">Save Address</Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
