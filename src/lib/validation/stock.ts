import { z } from "zod";

export const zObjectId = z.string().min(1);

export const zUom = z.enum(["UN", "M", "M2", "KG"]);
export const zItemType = z.enum(["FINISHED", "COMPONENT", "SERVICE"]);

export const zWarehouseType = z.enum(["MAIN", "WORKSHOP", "JOB_SITE", "CONSIGNMENT"]);
export const zLocationType = z.enum(["STORAGE", "PICK", "QUARANTINE", "DAMAGED"]);

export const zRefKind = z.enum(["PO", "SO", "PROJECT", "QUOTE", "COUNT", "MANUAL", "PRODUCTION"]);
export const zReservationStatus = z.enum(["ACTIVE", "RELEASED", "CONSUMED"]);

export const zRef = z.object({
  kind: zRefKind,
  id: z.string().min(1),
});

export const zCreateItem = z.object({
  type: zItemType,
  sku: z.string().min(1).max(64),
  name: z.string().min(1).max(256),
  brand: z.string().max(128).optional(),
  category: z.string().min(1).max(128),
  uom: zUom,
  track: z
    .object({
      lot: z.boolean().default(false),
      serial: z.boolean().default(false),
    })
    .default({ lot: false, serial: false }),
  attributes: z.record(z.any()).optional(),
  minStockByWarehouse: z
    .array(z.object({ warehouseId: zObjectId, min: z.number().min(0) }))
    .default([]),
  active: z.boolean().default(true),
});

export const zUpdateItem = zCreateItem.partial().extend({
  sku: z.string().min(1).max(64).optional(),
});

export const zCreateWarehouse = z.object({
  name: z.string().min(1).max(128),
  type: zWarehouseType,
  address: z.string().max(256).optional(),
  active: z.boolean().default(true),
});

export const zCreateLocation = z.object({
  warehouseId: zObjectId,
  code: z.string().min(1).max(64),
  type: zLocationType.default("STORAGE"),
  active: z.boolean().default(true),
});

export const zMovementBase = z.object({
  itemId: zObjectId,
  warehouseId: zObjectId,
  locationId: zObjectId.optional(),
  qty: z.number().positive(),
  uom: zUom,
  unitCost: z.number().min(0).optional(),
  lot: z.string().max(64).optional(),
  serial: z.string().max(128).optional(),
  note: z.string().max(512).optional(),
  ref: zRef.optional(),
});

export const zCreateMovement = z.discriminatedUnion("type", [
  z.object({ type: z.literal("IN") }).merge(zMovementBase),
  z.object({ type: z.literal("OUT") }).merge(zMovementBase),
  z.object({ type: z.literal("ADJUST") }).merge(
    zMovementBase.extend({
      // ADJUST puede ser positivo o negativo
      qty: z.number().refine((v) => v !== 0, "qty no puede ser 0"),
    }),
  ),
  z.object({ type: z.literal("TRANSFER") }).merge(
    z.object({
      itemId: zObjectId,
      uom: zUom,
      qty: z.number().positive(),
      from: z.object({
        warehouseId: zObjectId,
        locationId: zObjectId.optional(),
      }),
      to: z.object({
        warehouseId: zObjectId,
        locationId: zObjectId.optional(),
      }),
      lot: z.string().max(64).optional(),
      serial: z.string().max(128).optional(),
      note: z.string().max(512).optional(),
      ref: zRef.optional(),
    }),
  ),
]);

export const zCreateReservation = z.object({
  ref: zRef,
  warehouseId: zObjectId,
  lines: z.array(
    z.object({
      itemId: zObjectId,
      qty: z.number().positive(),
      uom: zUom,
      lot: z.string().max(64).optional(),
    }),
  ).min(1),
  note: z.string().max(512).optional(),
});

export const zCreateBom = z.object({
  finishedItemId: zObjectId,
  version: z.number().int().min(1).default(1),
  active: z.boolean().default(true),
  lines: z.array(
    z.object({
      componentItemId: zObjectId,
      qty: z.number().positive(),
      uom: zUom,
    }),
  ).min(1),
});

export const zUpdateBom = zCreateBom.partial();

export const zProduce = z.object({
  finishedItemId: zObjectId,
  warehouseId: zObjectId,
  locationId: zObjectId.optional(),
  qty: z.number().positive().default(1),
  ref: zRef.optional(),
  note: z.string().max(512).optional(),
  // si querés sobreescribir el consumo automático (opcional)
  overrideConsumeLines: z.array(
    z.object({
      componentItemId: zObjectId,
      qty: z.number().positive(),
      uom: zUom,
      warehouseId: zObjectId.optional(), // por defecto usa el mismo warehouseId
      locationId: zObjectId.optional(),
    }),
  ).optional(),
});
