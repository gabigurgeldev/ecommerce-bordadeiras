"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useAddToCartFeedback, type AddToCartItem } from "@/hooks/use-add-to-cart-feedback";
import { cn } from "@/lib/utils";
import { Check, Loader2, ShoppingBag, ShoppingCart } from "lucide-react";

interface AddToCartButtonProps extends Omit<ButtonProps, "onClick"> {
  item: AddToCartItem;
  icon?: "cart" | "bag" | "none";
  loadingLabel?: string;
  successLabel?: string;
  idleLabel?: string;
}

export function AddToCartButton({
  item,
  icon = "cart",
  loadingLabel,
  successLabel = "Adicionado!",
  idleLabel = "Adicionar",
  className,
  disabled,
  ...props
}: AddToCartButtonProps) {
  const { addToCart, status, reduceMotion } = useAddToCartFeedback();

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const Icon =
    icon === "bag" ? ShoppingBag : icon === "cart" ? ShoppingCart : null;

  return (
    <Button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        !reduceMotion && "tap-scale",
        !reduceMotion && isSuccess && "cta-pulse",
        className,
      )}
      onClick={() => void addToCart(item)}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel ?? idleLabel}
        </>
      ) : isSuccess ? (
        <>
          <Check className="h-4 w-4" />
          {successLabel}
        </>
      ) : (
        <>
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {idleLabel}
        </>
      )}
    </Button>
  );
}
