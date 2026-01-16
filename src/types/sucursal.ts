// /types/sucursal.ts
export type Sucursal = {
  _id: string;
  nombre: string;
  direccion: string;
  linkPagoAbierto?: string;
  cbu?: string;
  email?: string;
  qrPagoAbiertoImg?: string; // data-uri base64 o url
  aliasImg?: string; // data-uri base64 o url
  createdAt?: string | Date;
  updatedAt?: string | Date;
};
