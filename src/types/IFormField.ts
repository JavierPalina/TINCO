export interface IFormField {
    titulo: string;
    tipo: 'texto' | 'seleccion';
    opciones?: string[];
}
