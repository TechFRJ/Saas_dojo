"use client";

import { useState } from "react";
import { Payment, PaymentStatus } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { updatePayment } from "@/services/teacher";

const STATUS_VARIANT: Record<PaymentStatus, "success" | "warning" | "error"> = {
  paid: "success",
  pending: "warning",
  late: "error",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Pago",
  pending: "Pendente",
  late: "Atrasado",
};

interface PaymentRowProps {
  payment: Payment;
  onUpdated?: () => void;
}

export function PaymentRow({ payment, onUpdated }: PaymentRowProps) {
  const [loading, setLoading] = useState(false);

  async function markAsPaid() {
    if (payment.status === "paid") return;
    setLoading(true);
    try {
      await updatePayment(payment.id, "paid");
      onUpdated?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">
          R$ {payment.amount.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500">
          Vencimento: {new Date(payment.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={STATUS_VARIANT[payment.status]}>
          {STATUS_LABELS[payment.status]}
        </Badge>
        {payment.status !== "paid" && (
          <Button
            variant="ghost"
            loading={loading}
            onClick={markAsPaid}
            className="text-xs"
          >
            Confirmar
          </Button>
        )}
      </div>
    </div>
  );
}
