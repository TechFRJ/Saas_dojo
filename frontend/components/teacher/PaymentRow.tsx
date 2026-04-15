"use client";

import { useState } from "react";
import { Payment, PaymentStatus } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { updatePayment } from "@/services/teacher";
import { useToast } from "@/components/ui/Toast";

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
  const [showConfirm, setShowConfirm] = useState(false);
  const { showToast } = useToast();

  async function markAsPaid() {
    if (payment.status === "paid") return;
    setLoading(true);
    setShowConfirm(false);
    try {
      await updatePayment(payment.id, "paid");
      showToast("Pagamento marcado como pago", "success");
      onUpdated?.();
    } catch {
      showToast("Erro ao atualizar pagamento", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
              onClick={() => setShowConfirm(true)}
              className="text-xs"
            >
              Confirmar
            </Button>
          )}
        </div>
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirmar Pagamento"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="primary" loading={loading} onClick={markAsPaid}>
              Confirmar
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Confirmar pagamento de{" "}
          <strong>R$ {payment.amount.toFixed(2)}</strong> com vencimento em{" "}
          <strong>
            {new Date(payment.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
          </strong>
          ?
        </p>
      </Modal>
    </>
  );
}
