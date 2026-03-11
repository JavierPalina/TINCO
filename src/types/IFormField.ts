export interface IFormField {
  _id?: string;
  titulo: string;
  tipo:
    | "texto"
    | "textarea"
    | "numero"
    | "precio"
    | "fecha"
    | "checkbox"
    | "seleccion"
    | "combobox"
    | "archivo";
  opciones?: string[] | string;
  requerido: boolean;
}