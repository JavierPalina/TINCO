import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Proyecto, { ESTADOS_PROYECTO } from "@/models/Proyecto";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";

// 🔹 PUT: actualizar etapas / formularios / forzar estado
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }, // tu firma actual
) {
  const { params } = context;
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const body = await request.json();
    console.log("🟣 [PUT /api/proyectos/:id] body recibido:", body);

    const { etapaACompletar, datosFormulario, forzarEstado, estadoActual } = body;

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      console.log("🔴 Proyecto no encontrado:", id);
      return NextResponse.json(
        { success: false, error: "Proyecto no encontrado" },
        { status: 404 },
      );
    }

    console.log(
      "🟡 Estado actual antes de modificar:",
      proyecto.estadoActual,
      "visitaTecnica:",
      proyecto.visitaTecnica,
    );

    let proximoEstado = proyecto.estadoActual;

    // 🔸 Caso 1: completar etapa del workflow (visitaTecnica, medicion, etc.)
    if (etapaACompletar && datosFormulario !== undefined) {
      console.log("🟢 Caso workflow, etapaACompletar:", etapaACompletar);

      Object.assign((proyecto as any)[etapaACompletar], datosFormulario);

      (proyecto as any)[etapaACompletar].estado = "Completado";
      (proyecto as any)[etapaACompletar].fechaCompletado = new Date();

      switch (etapaACompletar) {
        case "visitaTecnica":
          proximoEstado = "Medición";
          break;
        case "medicion":
          if (datosFormulario.enviarAVerificacion === "Sí") {
            proximoEstado = "Verificación";
          }
          break;
        case "verificacion":
          if (datosFormulario.aprobadoParaProduccion === "Sí") {
            proximoEstado = "Taller";
          }
          break;
        case "taller":
          if (
            datosFormulario.pedidoListoParaEntrega === "Sí" &&
            datosFormulario.destinoFinal
          ) {
            proximoEstado = datosFormulario.destinoFinal;
          }
          break;
        case "deposito":
          if (datosFormulario.estadoInterno === "Listo para entrega") {
            proximoEstado = "Logística";
          }
          break;
        case "logistica":
          if (datosFormulario.estadoEntrega === "Entregado") {
            proximoEstado = "Completado";
          }
          break;
      }

      if (forzarEstado && ESTADOS_PROYECTO.includes(forzarEstado)) {
        console.log("🟠 Override manual de estado a:", forzarEstado);
        proximoEstado = forzarEstado;
      }

      proyecto.estadoActual = proximoEstado;

    // 🔸 Caso 2: actualización genérica de una sub-doc sin workflow
    } else if (datosFormulario && typeof datosFormulario === "object") {
      const [etapaKey] = Object.keys(datosFormulario);
      const subData = (datosFormulario as any)[etapaKey];

      console.log(
        "🔵 Caso genérico sub-doc. etapaKey:",
        etapaKey,
        "subData:",
        subData,
      );

      if (etapaKey) {
        // 👉 Si subData tiene campos → merge normal
        if (subData && Object.keys(subData).length > 0) {
          console.log("🔹 Merge normal de subdoc", etapaKey);
          Object.assign((proyecto as any)[etapaKey], subData);
        } else {
          // 👉 Objeto vacío → interpretamos como "borrar / vaciar" ese subdoc
          console.log(
            "🔻 Limpiando subdoc con $set",
            etapaKey,
            "en proyecto",
            proyecto._id.toString(),
          );

          // Usamos updateOne directo para evitar sutilezas de defaults
          await Proyecto.updateOne(
            { _id: proyecto._id },
            { $set: { [etapaKey]: {} } },
          );

          const proyectoActualizado = await Proyecto.findById(proyecto._id);
          console.log(
            "✅ Subdoc luego de limpiar:",
            etapaKey,
            (proyectoActualizado as any)?.[etapaKey],
          );

          return NextResponse.json({
            success: true,
            data: proyectoActualizado,
          });
        }
      }
    }

    // 🟢 Caso 3: cambio directo de estadoActual (como desde el botón "Finalizar")
    if (
      !etapaACompletar &&
      (datosFormulario === undefined ||
        (typeof datosFormulario === "object" &&
          Object.keys(datosFormulario).length === 0)) &&
      estadoActual &&
      ESTADOS_PROYECTO.includes(estadoActual)
    ) {
      console.log("🟢 Seteando estadoActual directo:", estadoActual);
      proyecto.estadoActual = estadoActual;
    }

    const proyectoActualizado = await proyecto.save();
    console.log(
      "✅ Proyecto guardado. estadoActual:",
      proyectoActualizado.estadoActual,
    );

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
  context: { params: Promise<{ id: string }> },
) {
  const { params } = context;
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
