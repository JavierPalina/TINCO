export interface IFormField {
    requerido: any;
    titulo: string;
    tipo: 'texto' | 'seleccion';
    opciones?: string[];
}
