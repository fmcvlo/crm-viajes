// ─── Enums / Literales ───────────────────────────────────────────────────────

export type Rol = "admin" | "agente";

export type EtapaLead =
  | "sin_contactar"
  | "contactado"
  | "cotizacion"
  | "en_pausa"
  | "ganado"
  | "perdido";

export type OrigenContacto =
  | "instagram_agencia"
  | "facebook"
  | "recomendado"
  | "web"
  | "instagram_agente"
  | "otros";

export type EstadoReserva =
  | "creada"
  | "enviada"
  | "aceptada"
  | "rechazada"
  | "cancelada";

export type CategoriaItem =
  | "hotel"
  | "vuelo"
  | "parque"
  | "transfer"
  | "seguro"
  | "crucero"
  | "otro";

export type CategoriaProveedor =
  | "parques"
  | "vuelos"
  | "hoteleria"
  | "cruceros"
  | "seguros"
  | "transfer"
  | "otro";

export type EstadoComision = "pendiente" | "verificada" | "pagada";

export type TipoObjetivo = "agencia" | "agente" | "incentivo";

export type TipoEvento =
  | "seguimiento"
  | "llamada"
  | "reunion"
  | "vencimiento"
  | "recordatorio";

export type TipoAutomatizacion =
  | "bienvenida"
  | "cotizacion"
  | "recordatorio_pago"
  | "post_viaje"
  | "cumpleanios";

export type Moneda = "ARS" | "USD";

// ─── Entidades principales ────────────────────────────────────────────────────

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  avatar?: string;
  activo: boolean;
  fechaAlta: string;
}

export interface PreferenciasContacto {
  restricciones?: string;
  aerolineas?: string;
  hoteles?: string;
}

export interface Contacto {
  id: string;
  tipo: "lead" | "cliente";
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  pais?: string;
  agenteId: string;
  origen: OrigenContacto;
  destinoInteres?: string;
  etapa: EtapaLead;
  motivoPausa?: string;
  notas?: string;
  fechaCreacion: string;
  fechaUltimoContacto?: string;
  // Campos cliente
  fechaNacimiento?: string;
  pasaporteNumero?: string;
  pasaporteVencimiento?: string;
  preferencias?: PreferenciasContacto;
  grupoFamiliar?: string[];
}

export interface ItemReserva {
  id: string;
  proveedorId: string;
  categoria: CategoriaItem;
  producto: string;
  checkIn?: string;
  checkOut?: string;
  cantidad: number;
  importe: number;
  moneda: Moneda;
  comisionEstimada: number;
}

export interface Reserva {
  id: string;
  nombre: string;
  clienteId: string;
  agenteId: string;
  estado: EstadoReserva;
  pasajeros: number;
  fechaLimitePago?: string;
  alertaParques: boolean;
  requiereHotel: boolean;
  requiereRestaurante: boolean;
  fechaEnvioGuia?: string;
  items: ItemReserva[];
  notas?: string;
  fechaCreacion: string;
  cancelacionRequiereAprobacion?: boolean;
}

export interface Proveedor {
  id: string;
  nombre: string;
  categoria: CategoriaProveedor;
  contacto?: string;
  cuentaComercial?: string;
  comisionPorcentaje: number;
  activo: boolean;
}

export interface Comision {
  id: string;
  reservaId: string;
  agenteId: string;
  proveedorId?: string;
  monto: number;
  moneda: Moneda;
  porcentaje: number;
  estado: EstadoComision;
  fechaVerificacion?: string;
  fechaPago?: string;
  fechaCreacion: string;
}

export interface Objetivo {
  id: string;
  tipo: TipoObjetivo;
  agenteId?: string;
  proveedorId?: string;
  anio: number;
  mes?: number;
  descripcion: string;
  metaReservas?: number;
  metaMonto: number;
  moneda: Moneda;
}

export interface EventoCalendario {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoEvento;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  agenteId: string;
  contactoId?: string;
  reservaId?: string;
  completado: boolean;
  esAutoGenerado?: boolean;
}

export interface AutomatizacionEmail {
  id: string;
  nombre: string;
  tipo: TipoAutomatizacion;
  asunto: string;
  cuerpo: string;
  activa: boolean;
  disparadorDias?: number;
  enviosTotales: number;
  fechaCreacion: string;
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  tipo: "info" | "alerta" | "exito" | "error";
  fechaCreacion: string;
  enlace?: string;
}
