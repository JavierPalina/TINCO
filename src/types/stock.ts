export type UOM = "UN" | "M" | "M2" | "KG";

export type ItemType = "FINISHED" | "COMPONENT" | "SERVICE";

export type StockMovementType =
  | "IN"
  | "OUT"
  | "TRANSFER"
  | "ADJUST"
  | "RESERVE"
  | "UNRESERVE"
  | "PRODUCE";

export type RefKind = "PO" | "SO" | "PROJECT" | "QUOTE" | "COUNT" | "MANUAL" | "PRODUCTION";

export type ReservationStatus = "ACTIVE" | "RELEASED" | "CONSUMED";

export type LocationType = "STORAGE" | "PICK" | "QUARANTINE" | "DAMAGED";
export type WarehouseType = "MAIN" | "WORKSHOP" | "JOB_SITE" | "CONSIGNMENT";

export interface Ref {
  kind: RefKind;
  id: string;
}

export interface ItemAttributes {
  line?: string;        // Línea/sistema
  color?: string;
  typology?: string;    // corrediza, batiente, etc.
  glassType?: string;   // DVH, templado, etc.
  glassThickness?: string;
  notes?: string;
  [key: string]: unknown;
}
