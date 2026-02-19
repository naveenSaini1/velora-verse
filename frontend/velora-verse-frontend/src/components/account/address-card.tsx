import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Address } from "@/types/address";

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (name: string) => void;
}

export function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{address.full_name}</span>
              <Badge variant="outline">{address.address_type}</Badge>
              {!!address.is_default && (
                <Badge variant="secondary">Default</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {address.address_line_1}
              {address.address_line_2 && `, ${address.address_line_2}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {address.city}, {address.state} - {address.pincode}
            </p>
            {address.phone && (
              <p className="text-sm text-muted-foreground mt-1">
                Phone: {address.phone}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(address)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(address.name)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
