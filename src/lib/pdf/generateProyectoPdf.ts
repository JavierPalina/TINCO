import { jsPDF } from "jspdf";
import type { ProyectoDTO, ClienteLite } from "@/types/proyecto";

// ─── constants ────────────────────────────────────────────────────────────────
const MX = 14;
const MY = 16;
const PW = 210;
const PH = 297;
const CW = PW - MX * 2;            // usable width
const GREEN: [number, number, number] = [79, 165, 136];
const HEADER_BG: [number, number, number] = [45, 120, 95];

export type PdfStage =
  | "visitaTecnica"
  | "medicion"
  | "verificacion"
  | "taller"
  | "deposito"
  | "logistica";

// ─── image helpers ─────────────────────────────────────────────────────────────
async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function isImageUrl(v: unknown): v is string {
  return typeof v === "string" && (v.startsWith("http") || v.startsWith("/"));
}

// ─── value formatter ───────────────────────────────────────────────────────────
function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (Array.isArray(v)) {
    if (v.length === 0) return "";
    if (isImageUrl(v[0])) return ""; // handled separately as images
    return v.join(", ");
  }
  if (v instanceof Date) return v.toLocaleDateString("es-AR");
  if (typeof v === "string") {
    // ISO dates
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
      const d = new Date(v);
      return isNaN(d.getTime()) ? v : d.toLocaleDateString("es-AR");
    }
    return v;
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return String(o.name ?? o.nombreCompleto ?? "");
  }
  return String(v);
}

// ─── pdf state ────────────────────────────────────────────────────────────────
interface St {
  doc: jsPDF;
  y: number;
  footer: string;
}

function newPage(st: St) {
  st.doc.addPage();
  st.y = MY;
  renderPageFooter(st);
}

function guard(st: St, needed: number) {
  if (st.y + needed > PH - 18) newPage(st);
}

function renderPageFooter(st: St) {
  st.doc.setFontSize(7);
  st.doc.setFont("helvetica", "normal");
  st.doc.setTextColor(160, 160, 160);
  st.doc.text(st.footer, MX, PH - 8);
  st.doc.setTextColor(0, 0, 0);
}

// ─── drawing primitives ────────────────────────────────────────────────────────
function drawSectionHeader(st: St, title: string) {
  guard(st, 18);
  st.y += 5;
  st.doc.setFillColor(...GREEN);
  st.doc.rect(MX, st.y, CW, 8, "F");
  st.doc.setTextColor(255, 255, 255);
  st.doc.setFontSize(9.5);
  st.doc.setFont("helvetica", "bold");
  st.doc.text(title.toUpperCase(), MX + 3, st.y + 5.5);
  st.doc.setTextColor(0, 0, 0);
  st.y += 12;
}

function drawSubHeader(st: St, title: string) {
  guard(st, 10);
  st.y += 3;
  st.doc.setFontSize(9);
  st.doc.setFont("helvetica", "bold");
  st.doc.setTextColor(60, 60, 60);
  st.doc.text(title, MX, st.y);
  st.doc.setDrawColor(200, 200, 200);
  st.doc.line(MX, st.y + 1.5, MX + CW, st.y + 1.5);
  st.doc.setTextColor(0, 0, 0);
  st.y += 6;
}

const LABEL_W = 62;
function drawField(st: St, label: string, value: unknown) {
  const v = fmt(value);
  if (!v) return;
  const lines = st.doc.splitTextToSize(v, CW - LABEL_W) as string[];
  const h = Math.max(5, lines.length * 4.8) + 1.5;
  guard(st, h + 2);

  st.doc.setFontSize(8.5);
  st.doc.setFont("helvetica", "bold");
  st.doc.setTextColor(90, 90, 90);
  st.doc.text(`${label}:`, MX, st.y);

  st.doc.setFont("helvetica", "normal");
  st.doc.setTextColor(20, 20, 20);
  lines.forEach((line, i) => st.doc.text(line, MX + LABEL_W, st.y + i * 4.8));
  st.y += h;
}

async function drawSignature(st: St, label: string, url: string) {
  if (!url) return;
  const b64 = await urlToBase64(url);
  if (!b64) return;
  const W = 70;
  const H = 25;
  guard(st, H + 12);
  st.doc.setFontSize(8);
  st.doc.setFont("helvetica", "bold");
  st.doc.setTextColor(90, 90, 90);
  st.doc.text(`${label}:`, MX, st.y);
  st.y += 4;
  st.doc.setDrawColor(180, 180, 180);
  st.doc.rect(MX, st.y, W, H);
  try {
    const ext = url.toLowerCase().includes(".png") ? "PNG" : "JPEG";
    st.doc.addImage(b64, ext, MX + 1, st.y + 1, W - 2, H - 2);
  } catch { /* skip */ }
  st.y += H + 5;
}

async function drawImageGrid(st: St, label: string, urls: string[]) {
  if (!urls.length) return;
  guard(st, 10);
  st.doc.setFontSize(8.5);
  st.doc.setFont("helvetica", "bold");
  st.doc.setTextColor(90, 90, 90);
  st.doc.text(`${label}:`, MX, st.y);
  st.y += 5;
  st.doc.setTextColor(0, 0, 0);

  const COLS = 2;
  const GAP = 4;
  const W = (CW - GAP * (COLS - 1)) / COLS;
  const H = W * 0.68;

  let col = 0;
  for (const url of urls) {
    const b64 = await urlToBase64(url);
    if (!b64) continue;
    if (col === 0) guard(st, H + 4);
    const x = MX + col * (W + GAP);
    st.doc.setDrawColor(210, 210, 210);
    st.doc.rect(x, st.y, W, H);
    try {
      const ext = url.toLowerCase().includes(".png") ? "PNG" : "JPEG";
      st.doc.addImage(b64, ext, x + 0.5, st.y + 0.5, W - 1, H - 1);
    } catch { /* skip */ }
    col++;
    if (col >= COLS) {
      col = 0;
      st.y += H + GAP;
    }
  }
  if (col > 0) st.y += H + GAP;
}

function drawMedidasTable(st: St, medidas: Record<string, unknown>[]) {
  if (!medidas.length) return;
  guard(st, 14);
  st.doc.setFontSize(8.5);
  st.doc.setFont("helvetica", "bold");
  st.doc.setTextColor(90, 90, 90);
  st.doc.text("Medidas tomadas:", MX, st.y);
  st.y += 5;

  const cols = ["#", "Alto", "Ancho", "Prof.", "Largo", "Cant."];
  const colW = [8, 25, 25, 25, 25, 25];
  const rowH = 6;

  // header row
  guard(st, rowH + 2);
  st.doc.setFillColor(230, 230, 230);
  st.doc.rect(MX, st.y, CW, rowH, "F");
  st.doc.setDrawColor(180, 180, 180);
  st.doc.rect(MX, st.y, CW, rowH);
  st.doc.setFont("helvetica", "bold");
  st.doc.setTextColor(50, 50, 50);
  let cx = MX + 1;
  cols.forEach((c, i) => {
    st.doc.text(c, cx, st.y + 4);
    cx += colW[i];
  });
  st.y += rowH;

  medidas.forEach((m, idx) => {
    guard(st, rowH);
    st.doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 248 : 255);
    st.doc.rect(MX, st.y, CW, rowH, "F");
    st.doc.setDrawColor(210, 210, 210);
    st.doc.rect(MX, st.y, CW, rowH);
    st.doc.setFont("helvetica", "normal");
    st.doc.setTextColor(20, 20, 20);
    cx = MX + 1;
    const vals = [
      String(idx + 1),
      String(m.alto ?? "-"),
      String(m.ancho ?? "-"),
      String(m.profundidad ?? "-"),
      String(m.largo ?? "-"),
      String(m.cantidad ?? "-"),
    ];
    vals.forEach((v, i) => {
      st.doc.text(v, cx, st.y + 4);
      cx += colW[i];
    });
    st.y += rowH;
  });
  st.y += 4;
}

// ─── stage renderers ───────────────────────────────────────────────────────────
async function renderVisitaTecnica(st: St, d: Record<string, unknown>) {
  drawSectionHeader(st, "Visita Técnica");
  drawSubHeader(st, "Datos generales");
  drawField(st, "Tipo de visita", d.tipoVisita);
  drawField(st, "Fecha visita", d.fechaVisita);
  drawField(st, "Hora", d.horaVisita);
  drawField(st, "Técnico asignado", d.asignadoA);
  drawField(st, "Estado tarea", d.estadoTareaVisita);

  drawSubHeader(st, "Ubicación");
  drawField(st, "Dirección", d.direccion);
  drawField(st, "Entrecalles", d.entrecalles);
  drawField(st, "Otra info", d.otraInfoDireccion);

  drawSubHeader(st, "Estado de la obra");
  drawField(st, "Estado obra", d.estadoObra);
  drawField(st, "Condición vanos", Array.isArray(d.condicionVanos) ? (d.condicionVanos as string[]).join(", ") : "");
  drawField(st, "Tipo abertura", d.tipoAberturaMedida);

  drawSubHeader(st, "Materiales");
  drawField(st, "Material solicitado", d.materialSolicitado);
  drawField(st, "Color", d.color);
  drawField(st, "Vidrios confirmados", d.vidriosConfirmados);
  drawField(st, "Recomendación técnica", d.recomendacionTecnica);
  drawField(st, "Observaciones", d.observacionesTecnicas);

  const medidas = Array.isArray(d.medidasTomadas) ? d.medidasTomadas as Record<string, unknown>[] : [];
  if (medidas.length) drawMedidasTable(st, medidas);

  const planos = Array.isArray(d.planosAdjuntos) ? d.planosAdjuntos.filter(isImageUrl) as string[] : [];
  const fotos = Array.isArray(d.fotosObra) ? d.fotosObra.filter(isImageUrl) as string[] : [];

  if (planos.length) await drawImageGrid(st, "Planos / croquis", planos);
  if (fotos.length) await drawImageGrid(st, "Fotos de la obra", fotos);
  if (d.firmaVerificacion && isImageUrl(d.firmaVerificacion))
    await drawSignature(st, "Firma verificación", d.firmaVerificacion as string);
}

async function renderMedicion(st: St, d: Record<string, unknown>) {
  drawSectionHeader(st, "Medición");
  drawSubHeader(st, "Datos generales");
  drawField(st, "N° orden medición", d.numeroOrdenMedicion);
  drawField(st, "Fecha medición", d.fechaMedicion);
  drawField(st, "Técnico asignado", d.asignadoA);
  drawField(st, "Dirección de obra", d.direccionObra);
  drawField(st, "Cliente / Obra / Empresa", d.clienteObraEmpresa);
  drawField(st, "Tipo abertura medida", d.tipoAberturaMedida);
  drawField(st, "Cantidad aberturas", d.cantidadAberturasMedidas);

  drawSubHeader(st, "Condición de vanos");
  drawField(st, "Condición vanos", Array.isArray(d.condicionVanos) ? (d.condicionVanos as string[]).join(", ") : "");
  drawField(st, "Estado obra al medir", d.estadoObraMedicion);

  const medidas = Array.isArray(d.medidasTomadas) ? d.medidasTomadas as Record<string, unknown>[] : [];
  if (medidas.length) drawMedidasTable(st, medidas);

  drawField(st, "Tolerancias recomendadas", d.toleranciasRecomendadas);

  drawSubHeader(st, "Carpintería y vidrio");
  drawField(st, "Tipo de perfil previsto", d.tipoPerfilPrevisto);
  drawField(st, "Color", d.color);
  drawField(st, "Tipo de vidrio", d.tipoVidrioSolicitado);

  drawSubHeader(st, "Cierre");
  drawField(st, "Observaciones", d.observacionesMedicion);
  drawField(st, "Estado final", d.estadoFinalMedicion);
  drawField(st, "Enviar a verificación", d.enviarAVerificacion);

  const planos = Array.isArray(d.planosAdjuntos) ? d.planosAdjuntos.filter(isImageUrl) as string[] : [];
  const fotos = Array.isArray(d.fotosMedicion) ? d.fotosMedicion.filter(isImageUrl) as string[] : [];

  if (planos.length) await drawImageGrid(st, "Planos / croquis adjuntos", planos);
  if (fotos.length) await drawImageGrid(st, "Fotos de medición", fotos);
  if (d.firmaValidacionTecnico && isImageUrl(d.firmaValidacionTecnico))
    await drawSignature(st, "Firma del técnico", d.firmaValidacionTecnico as string);
}

async function renderVerificacion(st: St, d: Record<string, unknown>) {
  drawSectionHeader(st, "Verificación");
  drawSubHeader(st, "Datos generales");
  drawField(st, "Cliente / Obra / Empresa", d.clienteObraEmpresa);
  drawField(st, "Dirección de obra", d.direccionObra);
  drawField(st, "Fecha revisión plano", d.fechaRevisionPlano);
  drawField(st, "Fecha verificación completa", d.fechaVerificacionCompleta);

  drawSubHeader(st, "Medidas");
  drawField(st, "Medidas verificadas", d.medidasVerificadas);
  drawField(st, "Observaciones medidas", d.medidasVerificadasObservaciones);
  drawField(st, "Fuente medidas", d.fuenteMedidas);
  drawField(st, "Planos revisados", d.planosRevisados);

  drawSubHeader(st, "Materiales");
  drawField(st, "Estado materiales", d.materialesDisponiblesEstado);
  drawField(st, "Lista materiales revisada", d.listaMaterialesRevisada);
  drawField(st, "Accesorios completos", d.accesoriosCompletosEstado);
  drawField(st, "Vidrios disponibles", d.vidriosDisponiblesEstado);
  drawField(st, "Materiales faltantes", d.materialesFaltantesDetalle);
  drawField(st, "Proveedor pendiente", d.materialesProveedorPendiente);
  drawField(st, "Accesorios faltantes", d.accesoriosFaltantesDetalle);

  drawSubHeader(st, "Perfiles y vidrios");
  drawField(st, "Tipo de material", d.tipoMaterial);
  drawField(st, "Tipo de perfil", d.tipoPerfilVerificado);
  drawField(st, "Proveedor perfil", d.proveedorPerfil);
  drawField(st, "Estado perfiles", d.estadoPerfiles);
  drawField(st, "Compatibilidad herrajes", d.compatibilidadHerrajes);
  drawField(st, "Medidas vidrios confirmadas", d.medidasVidriosConfirmadas);
  drawField(st, "Color", d.color);
  drawField(st, "Estado color", d.estadoColor);

  drawSubHeader(st, "Cierre");
  drawField(st, "Estado general verificación", d.estadoGeneralVerificacion);
  drawField(st, "Aprobado para producción", d.aprobadoParaProduccion);
  drawField(st, "Observaciones", d.observacionesVerificacion);

  const planos = Array.isArray(d.archivosPlanosCroquis) ? d.archivosPlanosCroquis.filter(isImageUrl) as string[] : [];
  if (planos.length) await drawImageGrid(st, "Planos / croquis", planos);
}

async function renderTaller(st: St, d: Record<string, unknown>) {
  drawSectionHeader(st, "Taller");
  drawSubHeader(st, "Datos generales");
  drawField(st, "N° orden taller", d.numeroOrdenTaller);
  drawField(st, "Fecha ingreso", d.fechaIngresoTaller);
  drawField(st, "Hora ingreso", d.horaIngresoTaller);
  drawField(st, "Técnico asignado", d.asignadoA);
  drawField(st, "Cliente / Obra / Empresa", d.clienteObraEmpresa);

  drawSubHeader(st, "Especificaciones");
  drawField(st, "Tipo abertura", d.tipoAbertura);
  drawField(st, "Material perfil", d.materialPerfil);
  drawField(st, "Tipo perfil", d.tipoPerfil);
  drawField(st, "Tipo perfil (otro)", d.tipoPerfilOtro);
  drawField(st, "Color", d.color);
  drawField(st, "Vidrio a colocar", d.vidrioAColocar);

  drawSubHeader(st, "Control");
  drawField(st, "Accesorios completos", d.accesoriosCompletos);
  drawField(st, "Material disponible", d.materialDisponible);
  drawField(st, "Detalle material", d.detalleMaterial);
  drawField(st, "Medidas verificadas", d.medidasVerificadas);
  drawField(st, "Planos verificados", d.planosVerificados);

  drawSubHeader(st, "Producción");
  drawField(st, "Estado taller", d.estadoTaller);
  drawField(st, "Fecha estimada finalización", d.fechaEstimadaFinalizacion);
  drawField(st, "Informe taller", d.informeTaller);
  drawField(st, "Control calidad por", d.controlCalidadRealizadoPor);
  drawField(st, "Fecha control calidad", d.fechaControlCalidad);
  drawField(st, "Pedido listo para entrega", d.pedidoListoEntrega);
  drawField(st, "Derivar a", d.derivarA);

  const evidencias = Array.isArray(d.evidenciasTaller) ? d.evidenciasTaller.filter(isImageUrl) as string[] : [];
  if (evidencias.length) await drawImageGrid(st, "Evidencias del taller", evidencias);
}

async function renderDeposito(st: St, d: Record<string, unknown>) {
  drawSectionHeader(st, "Depósito");
  drawSubHeader(st, "Datos generales");
  drawField(st, "N° orden depósito", d.numeroOrdenDeposito);
  drawField(st, "Fecha ingreso", d.fechaIngresoDeposito);
  drawField(st, "Responsable recepción", d.responsableRecepcion);
  drawField(st, "Origen pedido", d.origenPedido);
  drawField(st, "Estado producto recibido", d.estadoProductoRecibido);
  drawField(st, "Cantidad unidades", d.cantidadUnidades);

  drawSubHeader(st, "Almacenamiento");
  drawField(st, "Ubicación selección", d.ubicacionSeleccion);
  drawField(st, "Ubicación detalle", d.ubicacionDetalle);
  drawField(st, "Verificación embalaje", d.verificacionEmbalaje);
  drawField(st, "Identificación", d.identificacion);
  drawField(st, "Material almacenado", d.materialAlmacenado);
  drawField(st, "Detalle material", d.materialAlmacenadoOtro);
  drawField(st, "Control medidas OK", d.controlMedidasOk);
  drawField(st, "Cantidad piezas controladas", d.cantidadPiezasControladas);
  drawField(st, "Condición vidrio", d.condicionVidrio);

  drawSubHeader(st, "Salida");
  drawField(st, "Fecha salida / entrega", d.fechaSalidaEntrega);
  drawField(st, "Estado actual pedido", d.estadoActualPedido);
  drawField(st, "Observaciones", d.observacionesDeposito);
  drawField(st, "Usuario encargado", d.usuarioEncargado);

  const fotos = Array.isArray(d.fotosIngreso) ? d.fotosIngreso.filter(isImageUrl) as string[] : [];
  if (fotos.length) await drawImageGrid(st, "Fotos de ingreso", fotos);
}

async function renderLogistica(st: St, d: Record<string, unknown>) {
  drawSectionHeader(st, "Logística");
  drawSubHeader(st, "Datos generales");
  drawField(st, "N° orden logística", d.numeroOrdenLogistica);
  drawField(st, "Cliente / Obra / Empresa", d.clienteObraEmpresa);
  drawField(st, "Dirección entrega / obra", d.direccionEntregaObra);
  drawField(st, "Fecha programada entrega", d.fechaProgramadaEntrega);
  drawField(st, "Responsable logística", d.responsableLogistica);

  drawSubHeader(st, "Transporte");
  drawField(st, "Tipo de entrega", d.tipoEntrega);
  drawField(st, "Medio de transporte", d.medioTransporte);
  drawField(st, "Estado pedido recibido de taller", d.estadoPedidoRecibidoTaller);
  drawField(st, "Verificación embalaje", d.verificacionEmbalaje);
  drawField(st, "Cantidad bultos", d.cantidadBultos);

  drawSubHeader(st, "Entrega");
  drawField(st, "Hora salida", d.horaSalida);
  drawField(st, "Hora llegada", d.horaLlegada);
  drawField(st, "Responsable que recibe", d.responsableQueRecibe);
  drawField(st, "Estado entrega", d.estadoEntrega);
  drawField(st, "Fecha cierre entrega", d.fechaCierreEntrega);
  drawField(st, "Informe logística", d.informeLogistica);

  if (Array.isArray(d.notificarA) && (d.notificarA as string[]).length)
    drawField(st, "Notificar a", (d.notificarA as string[]).join(", "));

  const evidencias = Array.isArray(d.evidenciasEntrega) ? d.evidenciasEntrega.filter(isImageUrl) as string[] : [];
  if (evidencias.length) await drawImageGrid(st, "Evidencias de entrega", evidencias);

  if (d.firmaCliente && isImageUrl(d.firmaCliente))
    await drawSignature(st, "Firma del cliente", d.firmaCliente as string);
  if (d.firmaChofer && isImageUrl(d.firmaChofer))
    await drawSignature(st, "Firma del chofer", d.firmaChofer as string);
}

// ─── public API ────────────────────────────────────────────────────────────────
export async function generateProyectoPdf(
  proyecto: ProyectoDTO,
  stages: PdfStage[] = ["visitaTecnica", "medicion", "verificacion", "taller", "deposito", "logistica"],
  filename?: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const footer = `Generado el ${new Date().toLocaleString("es-AR")} • ${proyecto.numeroOrden}`;
  const st: St = { doc, y: MY, footer };

  const cliente =
    typeof proyecto.cliente === "object" && proyecto.cliente
      ? (proyecto.cliente as ClienteLite)
      : null;

  // ── cover / header ──────────────────────────────────────────────────
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, 0, PW, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`Proyecto ${proyecto.numeroOrden}`, MX, 18);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Estado: ${proyecto.estadoActual ?? "Sin estado"}`, MX, 28);

  if (cliente?.nombreCompleto) {
    doc.setFontSize(9);
    doc.text(`Cliente: ${cliente.nombreCompleto}`, MX, 35);
  }

  doc.setTextColor(0, 0, 0);
  st.y = 46;

  if (cliente) {
    if (cliente.telefono) drawField(st, "Teléfono", cliente.telefono);
    if (cliente.direccion) drawField(st, "Dirección", cliente.direccion);
  }

  // ── per-stage sections ──────────────────────────────────────────────
  for (const stage of stages) {
    const raw = proyecto[stage] as Record<string, unknown> | null | undefined;
    if (!raw) continue;
    const keys = Object.keys(raw).filter(
      (k) => !k.startsWith("_") && raw[k] !== null && raw[k] !== undefined && raw[k] !== "",
    );
    if (!keys.length) continue;

    switch (stage) {
      case "visitaTecnica": await renderVisitaTecnica(st, raw); break;
      case "medicion":      await renderMedicion(st, raw);      break;
      case "verificacion":  await renderVerificacion(st, raw);  break;
      case "taller":        await renderTaller(st, raw);        break;
      case "deposito":      await renderDeposito(st, raw);      break;
      case "logistica":     await renderLogistica(st, raw);     break;
    }
  }

  renderPageFooter(st);
  doc.save(filename ?? `${proyecto.numeroOrden}-completo.pdf`);
}
