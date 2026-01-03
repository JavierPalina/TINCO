// ./src/app/api/proyectos/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Proyecto, { ESTADOS_PROYECTO } from "@/models/Proyecto";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";

// ▶️ Tipos auxiliares
type EstadoProyecto = (typeof ESTADOS_PROYECTO)[number];

type EtapaNombre =
  | "visitaTecnica"
  | "medicion"
  | "verificacion"
  | "taller"
  | "deposito"
  | "logistica";

// subdocumentos de etapas con campos dinámicos
type EtapaSubdoc = {
  estado?: string;
  fechaCompletado?: Date;
  [field: string]: unknown;
};

type ProyectoDynamic = {
  [key: string]: EtapaSubdoc | undefined;
};

// body esperado en el PUT
interface ProyectoUpdateBody {
  etapaACompletar?: EtapaNombre;
  datosFormulario?: unknown;
  forzarEstado?: EstadoProyecto;
  estadoActual?: EstadoProyecto;
}

// 🔹 PUT: actualizar etapas / formularios / forzar estado
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const body = (await request.json()) as ProyectoUpdateBody;
    console.log("🟣 [PUT /api/proyectos/:id] body recibido:", body);

    const { etapaACompletar, forzarEstado, estadoActual } = body;
    const datosFormulario = body.datosFormulario;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      console.log("🔴 Proyecto no encontrado:", id);
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 },
      );
    }

    console.log("🟡 Estado actual antes de modificar:", proyecto.estadoActual);

    // ✅ Si estadoActual viene null, arrancamos proximoEstado en null y sólo lo cambiamos si corresponde.
    let proximoEstado: EstadoProyecto | null =
      (proyecto.estadoActual as EstadoProyecto) ?? null;

    const proyectoDynamic = proyecto as unknown as ProyectoDynamic;

    const isDatosObject =
      datosFormulario !== undefined &&
      typeof datosFormulario === "object" &&
      datosFormulario !== null &&
      !Array.isArray(datosFormulario);

    // ✅ Caso A: si viene forzarEstado, lo aplicamos SIEMPRE (ideal para tu dialog)
    if (forzarEstado && ESTADOS_PROYECTO.includes(forzarEstado)) {
      console.log("🟠 Override manual de estado a:", forzarEstado);
      proyecto.estadoActual = forzarEstado;
      const proyectoActualizado = await proyecto.save();
      return NextResponse.json({ success: true, data: proyectoActualizado });
    }

    // 🔸 Caso 1: completar etapa del workflow (visitaTecnica, medicion, etc.)
    if (etapaACompletar && isDatosObject) {
      console.log("🟢 Caso workflow, etapaACompletar:", etapaACompletar);

      // Aseguramos que exista el subdoc
      if (!proyectoDynamic[etapaACompletar]) {
        proyectoDynamic[etapaACompletar] = {};
      }

      const etapa = proyectoDynamic[etapaACompletar];
      if (etapa) {
        Object.assign(etapa, datosFormulario as Record<string, unknown>);
        etapa.estado = "Completado";
        etapa.fechaCompletado = new Date();
      }

      // Workflow: decidir próximo estado
      switch (etapaACompletar) {
        case "visitaTecnica":
          proximoEstado = "Medición";
          break;

        case "medicion": {
          const datosMedicion = datosFormulario as { enviarAVerificacion?: string };
          if (datosMedicion.enviarAVerificacion === "Sí") {
            proximoEstado = "Verificación";
          }
          break;
        }

        case "verificacion": {
          const datosVerificacion = datosFormulario as { aprobadoParaProduccion?: string };
          if (datosVerificacion.aprobadoParaProduccion === "Sí") {
            proximoEstado = "Taller";
          }
          break;
        }

        case "taller": {
          const datosTaller = datosFormulario as {
            pedidoListoParaEntrega?: string;
            destinoFinal?: EstadoProyecto;
          };
          if (datosTaller.pedidoListoParaEntrega === "Sí" && datosTaller.destinoFinal) {
            proximoEstado = datosTaller.destinoFinal;
          }
          break;
        }

        case "deposito": {
          const datosDeposito = datosFormulario as { estadoInterno?: string };
          if (datosDeposito.estadoInterno === "Listo para entrega") {
            proximoEstado = "Logística";
          }
          break;
        }

        case "logistica": {
          const datosLogistica = datosFormulario as { estadoEntrega?: string };
          if (datosLogistica.estadoEntrega === "Entregado") {
            proximoEstado = "Completado";
          }
          break;
        }
      }

      if (proximoEstado) {
        proyecto.estadoActual = proximoEstado as EstadoProyecto;
      }

      const proyectoActualizado = await proyecto.save();
      console.log("✅ Proyecto guardado (workflow). estadoActual:", proyectoActualizado.estadoActual);
      return NextResponse.json({ success: true, data: proyectoActualizado });
    }

    // 🔸 Caso 2: actualización genérica de una sub-doc sin workflow
    if (isDatosObject) {
      const datosGenericos = datosFormulario as Record<string, unknown>;
      const [etapaKey] = Object.keys(datosGenericos) as string[];
      const subData = datosGenericos[etapaKey] as Record<string, unknown> | undefined;

      console.log("🔵 Caso genérico sub-doc. etapaKey:", etapaKey, "subData:", subData);

      if (etapaKey) {
        if (subData && Object.keys(subData).length > 0) {
          const proyectoRecord = proyecto as unknown as Record<string, unknown>;
          const targetSubdoc = (proyectoRecord[etapaKey] ?? {}) as Record<string, unknown>;
          Object.assign(targetSubdoc, subData);
          proyectoRecord[etapaKey] = targetSubdoc;
        } else {
          console.log("🔻 Limpiando subdoc con $set", etapaKey, "en proyecto", proyecto._id.toString());
          await Proyecto.updateOne({ _id: proyecto._id }, { $set: { [etapaKey]: {} } });
          const proyectoActualizado = await Proyecto.findById(proyecto._id);
          return NextResponse.json({ success: true, data: proyectoActualizado });
        }
      }
    }

    // 🟢 Caso 3: cambio directo de estadoActual (si te llega explícito)
    if (estadoActual && ESTADOS_PROYECTO.includes(estadoActual)) {
      console.log("🟢 Seteando estadoActual directo:", estadoActual);
      proyecto.estadoActual = estadoActual;
      const proyectoActualizado = await proyecto.save();
      return NextResponse.json({ success: true, data: proyectoActualizado });
    }

    // ✅ Si no hubo nada que cambiar, devolvemos el proyecto actual (sin inventar estado)
    const proyectoActualizado = await proyecto.save();
    return NextResponse.json({ success: true, data: proyectoActualizado });
  } catch (error) {
    console.error("❌ Error en PUT /api/proyectos/[id]:", error);
    const errorMessage = error instanceof Error ? error.message : "Error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 },
    );
  }
}

// --- DELETE: BORRAR UN PROYECTO COMPLETO ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const deletedProyecto = await Proyecto.findByIdAndDelete(id);
    if (!deletedProyecto) {
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      success: true,
      data: { message: "Proyecto eliminado" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
