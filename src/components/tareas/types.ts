export interface Task {
    _id: string; // El ID siempre será un string en el frontend
    titulo: string;
    fechaVencimiento: string;
    completada: boolean;
    prioridad: 'Alta' | 'Media' | 'Baja';
    descripcion?: string;
    horaInicio?: string;
    horaFin?: string;
    cliente?: {
        _id: string;
        nombreCompleto: string;
    }
}