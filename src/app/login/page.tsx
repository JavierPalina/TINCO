"use client";

import { useForm, SubmitHandler } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useState, Suspense } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User } from "lucide-react";

type LoginFormInputs = { email: string; password: string; };
type RegisterFormInputs = LoginFormInputs & { name: string; };

function AuthComponent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  const loginForm = useForm<LoginFormInputs>();
  const registerForm = useForm<RegisterFormInputs>();

  const onLoginSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setError(null);
    setIsLoginLoading(true);
    const result = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
    });
    setIsLoginLoading(false);
    if (result?.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError(result?.error || 'Credenciales inválidas');
    }
  };

  const onRegisterSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setError(null);
    setRegisterSuccess(null);
    setIsRegisterLoading(true);
    try {
      await axios.post('/api/register', data);
      setRegisterSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
      registerForm.reset();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error en el registro');
    }
    setIsRegisterLoading(false);
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Image
                src="/logo.png"
                alt="Logo de la Empresa"
                width={100}
                height={100}
                priority
                className="mx-auto"
            />
            <h1 className="text-3xl font-bold mt-4">Acceso al CRM</h1>
            <p className="text-balance text-muted-foreground">
              Ingresa tus credenciales para continuar
            </p>
          </div>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="grid gap-4">
                <div className="grid gap-2 relative"><Label htmlFor="email-login">Email</Label><Mail className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" /><Input id="email-login" type="email" placeholder="nombre@ejemplo.com" required {...loginForm.register("email")} className="pl-9" /></div>
                <div className="grid gap-2 relative"><Label htmlFor="password-login">Contraseña</Label><Lock className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" /><Input id="password-login" type="password" required {...loginForm.register("password")} className="pl-9" /></div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoginLoading}>{isLoginLoading ? "Accediendo..." : "Acceder"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="register" className="mt-4">
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="grid gap-4">
                <div className="grid gap-2 relative"><Label htmlFor="name-reg">Nombre</Label><User className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" /><Input id="name-reg" placeholder="Tu nombre completo" required {...registerForm.register("name")} className="pl-9" /></div>
                <div className="grid gap-2 relative"><Label htmlFor="email-reg">Email</Label><Mail className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" /><Input id="email-reg" type="email" placeholder="nombre@ejemplo.com" required {...registerForm.register("email")} className="pl-9" /></div>
                <div className="grid gap-2 relative"><Label htmlFor="password-reg">Contraseña</Label><Lock className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" /><Input id="password-reg" type="password" required {...registerForm.register("password")} className="pl-9" /></div>
                {error && !registerSuccess && <p className="text-sm text-red-500 text-center">{error}</p>}
                {registerSuccess && <p className="text-sm text-green-500 text-center">{registerSuccess}</p>}
                <Button type="submit" className="w-full" disabled={isRegisterLoading}>{isRegisterLoading ? "Creando cuenta..." : "Crear Cuenta"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="hidden bg-gray-900 lg:flex relative flex-col justify-end p-10">
        <Image
          src="/imagen-login.jpg"
          alt="Imagen de Aberturas"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-primary opacity-60 mix-blend-multiply"></div>

        <div className="relative z-10 text-white">
            <h2 className="text-4xl font-bold">La gestión de tus clientes, simplificada.</h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
                Nuestro CRM te da las herramientas para nunca perder una oportunidad de venta.
            </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <AuthComponent />
        </Suspense>
    );
}