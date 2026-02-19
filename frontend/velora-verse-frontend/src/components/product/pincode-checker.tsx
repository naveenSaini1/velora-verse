"use client";

import { useState } from "react";
import { MapPin, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkPincode } from "@/lib/api/shipping";
import { cn } from "@/lib/utils";

interface PincodeCheckerProps {
  className?: string;
}

interface PincodeResult {
  serviceable: boolean;
  city?: string;
  state?: string;
  estimated_days?: number;
}

export function PincodeChecker({ className }: PincodeCheckerProps) {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PincodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isValidPincode = /^\d{6}$/.test(pincode);

  const handleCheck = async () => {
    if (!isValidPincode) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const data = await checkPincode(pincode);
      setResult(data);
    } catch {
      setError("Unable to check pincode. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValidPincode) {
      handleCheck();
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <MapPin className="size-4" />
        Check Delivery Availability
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Enter pincode"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            setPincode(value);
            setResult(null);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          className="max-w-[160px]"
        />
        <Button
          variant="outline"
          size="default"
          onClick={handleCheck}
          disabled={!isValidPincode || loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Check"
          )}
        </Button>
      </div>

      {/* Result display */}
      {result && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-md border p-3 text-sm",
            result.serviceable
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          )}
        >
          {result.serviceable ? (
            <>
              <CheckCircle2 className="size-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">
                  Delivery available
                  {result.city && ` to ${result.city}`}
                  {result.state && `, ${result.state}`}
                </p>
                {result.estimated_days != null && (
                  <p className="text-xs mt-0.5 opacity-80">
                    Estimated delivery in {result.estimated_days}{" "}
                    {result.estimated_days === 1 ? "day" : "days"}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <XCircle className="size-4 mt-0.5 flex-shrink-0" />
              <p className="font-medium">
                Sorry, delivery is not available to this pincode
              </p>
            </>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
