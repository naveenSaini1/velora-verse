"use client";

import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Address } from "@/types/address";

interface AddressSelectorProps {
  addresses: Address[];
  selected: string | null;
  onSelect: (name: string) => void;
  onAddNew: () => void;
}

export function AddressSelector({
  addresses,
  selected,
  onSelect,
  onAddNew,
}: AddressSelectorProps) {
  if (addresses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
        <MapPin className="size-10 text-muted-foreground" />
        <div>
          <p className="font-medium">No addresses saved</p>
          <p className="text-sm text-muted-foreground">
            Add a shipping address to continue with checkout.
          </p>
        </div>
        <Button onClick={onAddNew}>
          <Plus className="size-4" />
          Add Address
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={selected ?? undefined} onValueChange={onSelect}>
        <div className="grid gap-3">
          {addresses.map((address) => {
            const isSelected = selected === address.name;

            return (
              <Label
                key={address.name}
                htmlFor={`address-${address.name}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50",
                  isSelected && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem
                  id={`address-${address.name}`}
                  value={address.name}
                  className="mt-0.5"
                />

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{address.full_name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {address.address_type}
                    </Badge>
                    {!!address.is_default && (
                      <Badge variant="outline" className="text-[10px]">
                        Default
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {address.address_line_1}
                    {address.address_line_2 && `, ${address.address_line_2}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Phone: {address.phone}
                  </p>
                </div>
              </Label>
            );
          })}
        </div>
      </RadioGroup>

      <Button variant="outline" className="w-full" onClick={onAddNew}>
        <Plus className="size-4" />
        Add New Address
      </Button>
    </div>
  );
}
