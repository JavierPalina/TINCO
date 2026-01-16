// src/models/RoleAccess.ts
import mongoose, { Schema, type Document } from "mongoose";
import type { UserRole } from "@/lib/roles";

export type SectionKey =
  | "pipeline"
  | "proyectos"
  | "clientes"
  | "servicios"
  | "stock"
  | "users"
  | "notificaciones";

export type ProyectoStageKey = "tareas";

export interface IRoleAccess extends Document {
  role: UserRole;

  sections: Record<SectionKey, boolean>;
  proyectoStages: Record<ProyectoStageKey, boolean>;

  updatedAt?: Date;
  createdAt?: Date;
}

const RoleAccessSchema = new Schema<IRoleAccess>(
  {
    role: { type: String, required: true, unique: true },

    sections: {
      pipeline: { type: Boolean, default: false },
      proyectos: { type: Boolean, default: false },
      clientes: { type: Boolean, default: false },
      servicios: { type: Boolean, default: false },
      stock: { type: Boolean, default: false },
      users: { type: Boolean, default: false },
      notificaciones: { type: Boolean, default: false },
    },

    proyectoStages: {
      tareas: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.models.RoleAccess ||
  mongoose.model<IRoleAccess>("RoleAccess", RoleAccessSchema);
