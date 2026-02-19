import { Metadata } from "next";
import { OrderConfirmationContent } from "./order-confirmation-content";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Order Confirmed",
    description: "Your order has been placed successfully.",
  };
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;
  return <OrderConfirmationContent orderId={id} />;
}
