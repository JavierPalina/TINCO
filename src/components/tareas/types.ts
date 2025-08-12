export interface Task {
    _id: string;
    titulo: string;
    fechaVencimiento: string;
    completada: boolean;
    cliente?: {
        _id: string;
        nombreCompleto: string;
    }
}