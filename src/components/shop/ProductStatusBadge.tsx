import { Sparkles } from "lucide-react";
import {
  getProductStatusBadgeClass,
  getProductStatusBadgeText,
  type ProductStatus,
} from "@/lib/product-status";

interface ProductStatusBadgeProps {
  status: ProductStatus;
  className?: string;
  showIcon?: boolean;
}

export function ProductStatusBadge({
  status,
  className = "",
  showIcon = status === "on_update",
}: ProductStatusBadgeProps) {
  return (
    <span
      className={`badge inline-flex items-center gap-1 ${getProductStatusBadgeClass(status)} ${className}`}
    >
      {showIcon && <Sparkles className="h-3 w-3" aria-hidden />}
      {getProductStatusBadgeText(status)}
    </span>
  );
}
