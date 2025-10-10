export interface IFormField {
    requerido: boolean;
    titulo: string;
    tipo: 'texto' | 'seleccion';
    opciones?: string[];
}
