import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name?: string; // Asegúrate de que el campo se llame 'name'
  email?: string;
  emailVerified?: Date | null;
  image?: string;
  password?: string;
  rol: 'vendedor' | 'admin';
  activo: boolean;
}

const UserSchema: Schema = new Schema({
  name: { // El campo se llama 'name' para ser consistente
    type: String,
    // Quitamos 'required' aquí porque NextAuth y nuestra API de registro ya lo manejan
  },
  email: {
    type: String,
    unique: true,
  },
  emailVerified: {
    type: Date,
    default: null,
  },
  image: {
    type: String,
  },
  password: {
    type: String,
    select: false,
  },
  rol: {
    type: String,
    required: true,
    enum: ['vendedor', 'admin'],
    default: 'vendedor',
  },
  activo: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);