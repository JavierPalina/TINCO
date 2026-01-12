export interface IFormField {
    requerido: boolean;
    titulo: string;
    tipo: 'texto' | 'seleccion' | 'precio';
    opciones?: string[];
}
