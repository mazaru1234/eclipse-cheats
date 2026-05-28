export const PRODUCT_STATUSES = [
  "undetected",
  "on_update",
  "use_on_risk",
  "detected",
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "undetected", label: "Undetected" },
  { value: "on_update", label: "On Update" },
  { value: "use_on_risk", label: "Use on Risk" },
  { value: "detected", label: "Detected" },
];

export function getProductStatusLabel(status: ProductStatus): string {
  return PRODUCT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function getProductStatusBadgeText(status: ProductStatus): string {
  switch (status) {
    case "undetected":
      return "UNDETECTED";
    case "on_update":
      return "ON UPDATE";
    case "use_on_risk":
      return "USE ON RISK";
    case "detected":
      return "DETECTED";
  }
}

export function getProductStatusBadgeClass(status: ProductStatus): string {
  switch (status) {
    case "undetected":
      return "border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] text-[var(--color-success)]";
    case "on_update":
      return "badge-gold";
    case "use_on_risk":
      return "border-[rgba(249,115,22,0.35)] bg-[rgba(249,115,22,0.15)] text-orange-300";
    case "detected":
      return "border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.12)] text-[var(--color-danger)]";
  }
}

export function isProductStatus(value: unknown): value is ProductStatus {
  return typeof value === "string" && PRODUCT_STATUSES.includes(value as ProductStatus);
}
