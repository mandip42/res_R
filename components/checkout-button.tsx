"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type PlanKey = "pro" | "pro_year" | "lifetime";

type CheckoutButtonProps = {
  plan: PlanKey;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "subtle";
  className?: string;
};

export function CheckoutButton({
  plan,
  children,
  variant = "default",
  className,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?redirect=/pricing");
          return;
        }
        alert(data?.error ?? "Checkout failed. Try again.");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout failed. Try again.");
      }
    } catch {
      alert("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner className="h-4 w-4" />
          Redirecting…
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
