"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  Plus,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useRequireAuth } from "@/lib/hooks/use-auth";
import { useCart } from "@/lib/hooks/use-cart";
import { useSettingsStore } from "@/lib/stores/settings-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getAddresses, addAddress } from "@/lib/api/addresses";
import { getShippingRates } from "@/lib/api/shipping";
import { placeOrder } from "@/lib/api/orders";
import { createPayment, verifyPayment } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/utils/constants";
import type { Address, AddressPayload } from "@/types/address";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Currency } from "@/components/shared/currency";
import { FrappeImage } from "@/components/shared/frappe-image";
import { PageLoading } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { CouponInput } from "@/components/cart/coupon-input";
import { LoyaltyPointsInput } from "@/components/cart/loyalty-points-input";
import { GiftCardInput } from "@/components/cart/gift-card-input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShippingRate {
  method: string;
  charge: number;
  estimated_days: number;
}

interface AddressFormData {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

const INITIAL_ADDRESS_FORM: AddressFormData = {
  full_name: "",
  phone: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  is_default: false,
};

const STEPS = [
  { id: 1, label: "Address", icon: MapPin },
  { id: 2, label: "Shipping", icon: Truck },
  { id: 3, label: "Payment", icon: CreditCard },
  { id: 4, label: "Review", icon: Check },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading } = useRequireAuth();
  const { cart, fetchCart } = useCart();
  const settings = useSettingsStore((s) => s.settings);
  const user = useAuthStore((s) => s.user);

  // Current step
  const [currentStep, setCurrentStep] = useState(1);
  const stepDirection = useRef(1); // 1 = forward, -1 = backward

  // Step 1: Address
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [selectedAddressName, setSelectedAddressName] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormData>(INITIAL_ADDRESS_FORM);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Step 2: Shipping
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>("");

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [couponCode, setCouponCode] = useState<string | undefined>(undefined);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [giftCardCode, setGiftCardCode] = useState<string | undefined>(undefined);
  const [giftCardAmount, setGiftCardAmount] = useState(0);

  // Step 4 / Order placement
  const [orderNotes, setOrderNotes] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    async function loadAddresses() {
      try {
        const result = await getAddresses();
        const addressList = Array.isArray(result) ? result : (result.addresses ?? []);
        setAddresses(addressList);
        // Auto-select default address
        const defaultAddr = addressList.find((a: { is_default: boolean }) => a.is_default);
        if (defaultAddr) {
          setSelectedAddressName(defaultAddr.name);
        } else if (addressList.length > 0) {
          setSelectedAddressName(addressList[0].name);
        }
      } catch {
        toast.error("Failed to load addresses");
      } finally {
        setIsLoadingAddresses(false);
      }
    }
    loadAddresses();
  }, []);

  // Sync coupon from cart
  useEffect(() => {
    if (cart?.coupon_code) {
      setCouponCode(cart.coupon_code);
    }
  }, [cart?.coupon_code]);

  // Set default payment method based on settings
  useEffect(() => {
    if (settings) {
      if (settings.razorpay_enabled) {
        setPaymentMethod("Razorpay");
      } else if (settings.cod_enabled) {
        setPaymentMethod("COD");
      }
    }
  }, [settings]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const selectedAddress = addresses.find((a) => a.name === selectedAddressName);

  const selectedShippingRate = shippingRates.find(
    (r) => r.method === selectedShippingMethod
  );

  const shippingCharge = selectedShippingRate?.charge ?? 0;
  const subtotal = cart?.subtotal ?? cart?.total ?? 0;
  const taxAmount = cart?.tax_amount ?? 0;
  const couponDiscount = cart?.discount_amount ?? 0;
  const totalDiscounts = couponDiscount + loyaltyDiscount + giftCardAmount;
  const grandTotal = Math.max(
    0,
    subtotal + shippingCharge + taxAmount - totalDiscounts
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const fetchShippingRates = useCallback(
    async (addressName: string) => {
      setIsLoadingRates(true);
      try {
        const data = await getShippingRates({ shipping_address: addressName });
        // Backend returns { shipping_charge, free_shipping, zone_name }
        // Convert to rates array for the UI
        const rates: ShippingRate[] = data.rates ?? [
          {
            method: data.free_shipping ? "Free Shipping" : (data.zone_name || "Standard"),
            charge: data.shipping_charge ?? 0,
            estimated_days: data.free_shipping ? 5 : 7,
          },
        ];
        setShippingRates(rates);
        if (rates.length > 0) {
          setSelectedShippingMethod(rates[0].method);
        }
      } catch {
        toast.error("Failed to load shipping rates");
        setShippingRates([]);
      } finally {
        setIsLoadingRates(false);
      }
    },
    []
  );

  const handleSaveAddress = async () => {
    // Validate
    if (
      !addressForm.full_name.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.address_line_1.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.pincode.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSavingAddress(true);
    try {
      const payload: AddressPayload = {
        full_name: addressForm.full_name.trim(),
        phone: addressForm.phone.trim(),
        address_type: "Shipping",
        address_line_1: addressForm.address_line_1.trim(),
        address_line_2: addressForm.address_line_2.trim() || undefined,
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        pincode: addressForm.pincode.trim(),
        country: addressForm.country || "India",
        is_default: addressForm.is_default,
      };

      const result = await addAddress(payload);
      // Refetch addresses to get the full address object
      const addrData = await getAddresses();
      const allAddresses = Array.isArray(addrData) ? addrData : (addrData.addresses ?? []);
      setAddresses(allAddresses);
      setSelectedAddressName(result.address);
      setShowAddressForm(false);
      setAddressForm(INITIAL_ADDRESS_FORM);
      toast.success("Address saved");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save address");
      }
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!selectedAddressName) {
        toast.error("Please select a shipping address");
        return;
      }
      // Fetch shipping rates for selected address
      if (selectedAddressName) {
        await fetchShippingRates(selectedAddressName);
      }
      stepDirection.current = 1;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedShippingMethod) {
        toast.error("Please select a shipping method");
        return;
      }
      stepDirection.current = 1;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!paymentMethod) {
        toast.error("Please select a payment method");
        return;
      }
      stepDirection.current = 1;
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      stepDirection.current = -1;
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressName || !paymentMethod) {
      toast.error("Missing required information");
      return;
    }

    setIsPlacingOrder(true);

    try {
      const order = await placeOrder({
        shipping_address: selectedAddressName,
        payment_method: paymentMethod,
        coupon_code: couponCode,
        loyalty_points: loyaltyPoints > 0 ? loyaltyPoints : undefined,
        gift_card_code: giftCardCode,
        notes: orderNotes.trim() || undefined,
      });

      if (paymentMethod === "Razorpay") {
        // Create Razorpay payment
        const paymentData = await createPayment({
          order_name: order.name,
          payment_method: "Razorpay",
        });

        // Open Razorpay modal
        const options: RazorpayOptions = {
          key: paymentData.razorpay_key_id,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: settings?.store_name || "Velora Verse",
          description: `Order ${order.name}`,
          order_id: paymentData.razorpay_order_id,
          handler: async (response: RazorpaySuccessResponse) => {
            try {
              await verifyPayment({
                order_name: order.name,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success("Payment successful!");
              router.push(ROUTES.ORDER_CONFIRMATION(order.name));
            } catch (err) {
              if (err instanceof ApiError) {
                toast.error(`Payment verification failed: ${err.message}`);
              } else {
                toast.error("Payment verification failed. Please contact support.");
              }
              setIsPlacingOrder(false);
            }
          },
          prefill: {
            name: user?.full_name,
            email: user?.email,
            contact: user?.phone,
          },
          theme: {
            color: "#d4634a",
          },
          modal: {
            ondismiss: () => {
              toast.error("Payment was cancelled");
              setIsPlacingOrder(false);
            },
          },
        };

        if (!window.Razorpay) {
          toast.error("Payment gateway is still loading. Please try again.");
          setIsPlacingOrder(false);
          return;
        }
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        // COD - redirect to confirmation
        toast.success("Order placed successfully!");
        router.push(ROUTES.ORDER_CONFIRMATION(order.name));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to place order. Please try again.");
      }
      setIsPlacingOrder(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render guards
  // ---------------------------------------------------------------------------

  if (isAuthLoading) {
    return <PageLoading />;
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title="Your cart is empty"
          description="Add some items to your cart before checking out."
          actionLabel="Continue Shopping"
          actionHref={ROUTES.PRODUCTS}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Sub-renders
  // ---------------------------------------------------------------------------

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="checkout-step-ring"
                      className="absolute -inset-1 rounded-full border-2 border-primary"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted-foreground/20 text-muted-foreground"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <Check className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <motion.div key="icon">
                          <StepIcon className="h-5 w-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <span
                  className={`mt-2 text-xs font-medium transition-colors duration-200 ${
                    isActive || isCompleted
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-muted-foreground/20">
                  <motion.div
                    className="h-full bg-primary"
                    initial={false}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAddressStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Shipping Address</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddressForm(!showAddressForm)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Address
        </Button>
      </div>

      {/* Add new address form */}
      {showAddressForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addr_full_name">Full Name *</Label>
                <Input
                  id="addr_full_name"
                  value={addressForm.full_name}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Recipient name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr_phone">Phone *</Label>
                <Input
                  id="addr_phone"
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr_line_1">Address Line 1 *</Label>
              <Input
                id="addr_line_1"
                value={addressForm.address_line_1}
                onChange={(e) =>
                  setAddressForm((prev) => ({ ...prev, address_line_1: e.target.value }))
                }
                placeholder="House/flat number, street name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr_line_2">Address Line 2</Label>
              <Input
                id="addr_line_2"
                value={addressForm.address_line_2}
                onChange={(e) =>
                  setAddressForm((prev) => ({ ...prev, address_line_2: e.target.value }))
                }
                placeholder="Apartment, suite, landmark (optional)"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="addr_city">City *</Label>
                <Input
                  id="addr_city"
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr_state">State *</Label>
                <Input
                  id="addr_state"
                  value={addressForm.state}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, state: e.target.value }))
                  }
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr_pincode">Pincode *</Label>
                <Input
                  id="addr_pincode"
                  value={addressForm.pincode}
                  onChange={(e) =>
                    setAddressForm((prev) => ({ ...prev, pincode: e.target.value }))
                  }
                  placeholder="110001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addr_country">Country</Label>
              <Input
                id="addr_country"
                value={addressForm.country}
                onChange={(e) =>
                  setAddressForm((prev) => ({ ...prev, country: e.target.value }))
                }
                placeholder="India"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="addr_default"
                checked={addressForm.is_default}
                onCheckedChange={(checked) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    is_default: checked === true,
                  }))
                }
              />
              <Label htmlFor="addr_default" className="text-sm font-normal">
                Set as default shipping address
              </Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveAddress} disabled={isSavingAddress}>
                {isSavingAddress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Address"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddressForm(false);
                  setAddressForm(INITIAL_ADDRESS_FORM);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Address list */}
      {isLoadingAddresses ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted" />
                <div className="h-3 w-40 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : addresses.length === 0 && !showAddressForm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No saved addresses</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a shipping address to continue
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowAddressForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <RadioGroup
          value={selectedAddressName}
          onValueChange={setSelectedAddressName}
          className="grid gap-3 sm:grid-cols-2"
        >
          {addresses.map((addr) => (
            <Label
              key={addr.name}
              htmlFor={`addr-${addr.name}`}
              className="cursor-pointer [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
            >
              <Card className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem
                      value={addr.name}
                      id={`addr-${addr.name}`}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{addr.full_name}</p>
                        {!!addr.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {addr.address_line_1}
                        {addr.address_line_2 && `, ${addr.address_line_2}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {addr.city}, {addr.state} {addr.pincode}
                      </p>
                      <p className="text-sm text-muted-foreground">{addr.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Label>
          ))}
        </RadioGroup>
      )}
    </div>
  );

  const renderShippingStep = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Shipping Method</h2>

      {selectedAddress && (
        <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
          <p className="text-sm font-medium">Delivering to:</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedAddress.full_name} - {selectedAddress.address_line_1},{" "}
            {selectedAddress.city}, {selectedAddress.state}{" "}
            {selectedAddress.pincode}
          </p>
        </div>
      )}

      {isLoadingRates ? (
        <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading shipping options...</span>
        </div>
      ) : shippingRates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Truck className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No shipping options available</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We couldn&apos;t find shipping options for this address. Please try
              a different address.
            </p>
          </CardContent>
        </Card>
      ) : (
        <RadioGroup
          value={selectedShippingMethod}
          onValueChange={setSelectedShippingMethod}
          className="space-y-3"
        >
          {shippingRates.map((rate) => (
            <Label
              key={rate.method}
              htmlFor={`ship-${rate.method}`}
              className="cursor-pointer [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
            >
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <RadioGroupItem
                    value={rate.method}
                    id={`ship-${rate.method}`}
                  />
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rate.method}</p>
                    <p className="text-xs text-muted-foreground">
                      Estimated delivery: {rate.estimated_days}{" "}
                      {rate.estimated_days === 1 ? "day" : "days"}
                    </p>
                  </div>
                  <div className="text-right">
                    {rate.charge === 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      >
                        FREE
                      </Badge>
                    ) : (
                      <Currency
                        amount={rate.charge}
                        className="text-sm font-semibold"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </Label>
          ))}
        </RadioGroup>
      )}
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Payment Method</h2>

      {/* Payment method selection */}
      <RadioGroup
        value={paymentMethod}
        onValueChange={setPaymentMethod}
        className="space-y-3"
      >
        {settings?.razorpay_enabled && (
          <Label
            htmlFor="pay-razorpay"
            className="cursor-pointer [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <RadioGroupItem value="Razorpay" id="pay-razorpay" />
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Pay Online</p>
                  <p className="text-xs text-muted-foreground">
                    Credit/Debit Card, UPI, Net Banking, Wallets
                  </p>
                </div>
              </CardContent>
            </Card>
          </Label>
        )}

        {settings?.cod_enabled && (
          <Label
            htmlFor="pay-cod"
            className="cursor-pointer [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5"
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <RadioGroupItem value="COD" id="pay-cod" />
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground">
                    Pay when your order is delivered
                  </p>
                </div>
              </CardContent>
            </Card>
          </Label>
        )}
      </RadioGroup>

      <Separator />

      {/* Discounts section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Apply Discounts</h3>

        {/* Coupon */}
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Coupon Code</p>
          <CouponInput
            onApply={(code) => {
              setCouponCode(code);
              fetchCart();
            }}
            appliedCode={couponCode}
            onRemove={() => {
              setCouponCode(undefined);
              fetchCart();
            }}
            orderTotal={subtotal}
          />
        </div>

        {/* Loyalty Points */}
        {settings?.enable_loyalty_points && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Loyalty Points</p>
            <LoyaltyPointsInput
              orderTotal={subtotal}
              onApply={(points, discount) => {
                setLoyaltyPoints(points);
                setLoyaltyDiscount(discount);
              }}
              onRemove={() => {
                setLoyaltyPoints(0);
                setLoyaltyDiscount(0);
              }}
            />
          </div>
        )}

        {/* Gift Card */}
        {settings?.enable_gift_cards && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Gift Card</p>
            <GiftCardInput
              orderTotal={subtotal}
              onApply={(code, amount) => {
                setGiftCardCode(code);
                setGiftCardAmount(amount);
              }}
              onRemove={() => {
                setGiftCardCode(undefined);
                setGiftCardAmount(0);
              }}
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Order summary */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <Currency amount={subtotal} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            {shippingCharge === 0 ? (
              <span className="text-emerald-600 font-medium">Free</span>
            ) : (
              <Currency amount={shippingCharge} />
            )}
          </div>
          {taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <Currency amount={taxAmount} />
            </div>
          )}
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Coupon Discount</span>
              <span className="text-emerald-600 font-medium">
                -<Currency amount={couponDiscount} />
              </span>
            </div>
          )}
          {loyaltyDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Loyalty Discount</span>
              <span className="text-emerald-600 font-medium">
                -<Currency amount={loyaltyDiscount} />
              </span>
            </div>
          )}
          {giftCardAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gift Card</span>
              <span className="text-emerald-600 font-medium">
                -<Currency amount={giftCardAmount} />
              </span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between">
            <span className="font-bold">Total</span>
            <Currency amount={grandTotal} className="text-lg font-bold text-primary" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Review Your Order</h2>

      {/* Shipping address */}
      {selectedAddress && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{selectedAddress.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {selectedAddress.address_line_1}
              {selectedAddress.address_line_2 && `, ${selectedAddress.address_line_2}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedAddress.city}, {selectedAddress.state}{" "}
              {selectedAddress.pincode}
            </p>
            <p className="text-sm text-muted-foreground">
              Phone: {selectedAddress.phone}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Shipping method */}
      {selectedShippingRate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4" />
              Shipping Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{selectedShippingRate.method}</p>
                <p className="text-xs text-muted-foreground">
                  Est. {selectedShippingRate.estimated_days}{" "}
                  {selectedShippingRate.estimated_days === 1 ? "day" : "days"}
                </p>
              </div>
              {selectedShippingRate.charge === 0 ? (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                >
                  FREE
                </Badge>
              ) : (
                <Currency
                  amount={selectedShippingRate.charge}
                  className="font-semibold"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment method */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4" />
            Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium">
            {paymentMethod === "Razorpay"
              ? "Pay Online (Razorpay)"
              : "Cash on Delivery"}
          </p>
        </CardContent>
      </Card>

      {/* Order items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4" />
            Order Items ({cart.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {cart.items.map((item) => (
              <div key={item.name || item.variant} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted">
                  <FrappeImage
                    src={item.image}
                    alt={item.item_name ?? item.variant_title ?? "Product"}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.item_name ?? item.variant_title ?? "Product"}
                  </p>
                  {item.variant_display && (
                    <p className="text-xs text-muted-foreground">
                      {item.variant_display}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                </div>
                <Currency amount={item.amount} className="text-sm font-semibold" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Order Notes (Optional)</CardTitle>
          <CardDescription className="text-xs">
            Add any special instructions for your order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Any special instructions or delivery notes..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Total breakdown */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <Currency amount={subtotal} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              {shippingCharge === 0 ? (
                <span className="text-emerald-600 font-medium">Free</span>
              ) : (
                <Currency amount={shippingCharge} />
              )}
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <Currency amount={taxAmount} />
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Coupon ({couponCode})
                </span>
                <span className="text-emerald-600 font-medium">
                  -<Currency amount={couponDiscount} />
                </span>
              </div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Loyalty ({loyaltyPoints.toLocaleString()} pts)
                </span>
                <span className="text-emerald-600 font-medium">
                  -<Currency amount={loyaltyDiscount} />
                </span>
              </div>
            )}
            {giftCardAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gift Card</span>
                <span className="text-emerald-600 font-medium">
                  -<Currency amount={giftCardAmount} />
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-lg font-bold">Total</span>
              <Currency amount={grandTotal} className="text-xl font-bold text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main layout
  // ---------------------------------------------------------------------------

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Button variant="ghost" size="sm" className="mb-4 rounded-xl" asChild>
          <Link href={ROUTES.CART}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>

        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      </motion.div>

      {/* Step indicator */}
      {renderStepIndicator()}

      {/* Step content */}
      <div className="mb-8 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: stepDirection.current * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: stepDirection.current * -60 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {currentStep === 1 && renderAddressStep()}
            {currentStep === 2 && renderShippingStep()}
            {currentStep === 3 && renderPaymentStep()}
            {currentStep === 4 && renderReviewStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between border-t border-border/50 pt-6">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 1 || isPlacingOrder}
          className="rounded-xl transition-all duration-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {currentStep < 4 ? (
          <Button onClick={handleNextStep} className="rounded-xl transition-all duration-200">
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="rounded-xl transition-all duration-200"
          >
            {isPlacingOrder ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                Place Order - <Currency amount={grandTotal} />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
