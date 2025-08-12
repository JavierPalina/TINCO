"use client";

import { useForm, SubmitHandler } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useState } from 'react';
import Image from 'next/image'; // <-- 1. Importar Image de Next.js
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ... (Los 'types' de los formularios siguen igual)
type LoginFormInputs = { email: string; password: string; };
type RegisterFormInputs = LoginFormInputs & { name: string; };

export default function LoginPage() {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted p-4">
        {/* --- 2. AÑADIR EL LOGO --- */}
        <div className="mb-8">
            <Image
                src="/logo.png" // Asegúrate de que el nombre del archivo coincida
                alt="Logo de la Empresa"
                width={150} // Ajusta el tamaño según tu logo
                height={150}
                priority // Carga el logo más rápido
            />
        </div>

        <Tabs defaultValue="login" className="w-full max-w-sm">
            <TabsList className="grid w-full grid-cols-2">
                {/* --- 3. APLICAR COLOR PRIMARIO A LAS PESTAÑAS --- */}
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle>Bienvenido de Nuevo</CardTitle>
                        <CardDescription>Accede a tu cuenta para continuar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                            {/* ... (campos del formulario de login sin cambios) ... */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" {...loginForm.register("email", { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input id="password" type="password" {...loginForm.register("password", { required: true })} />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            {/* --- 4. APLICAR COLOR PRIMARIO AL BOTÓN --- */}
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoginLoading}>
                                {isLoginLoading ? "Accediendo..." : "Acceder"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="register">
                <Card>
                    <CardHeader>
                        <CardTitle>Crear Cuenta</CardTitle>
                        <CardDescription>Regístrate para empezar a usar el CRM.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                            {/* ... (campos del formulario de registro sin cambios) ... */}
                            <div className="space-y-2">
                                <Label htmlFor="name-reg">Nombre</Label>
                                <Input id="name-reg" {...registerForm.register("name", { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email-reg">Email</Label>
                                <Input id="email-reg" type="email" {...registerForm.register("email", { required: true })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-reg">Contraseña</Label>
                                <Input id="password-reg" type="password" {...registerForm.register("password", { required: true })} />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            {registerSuccess && <p className="text-sm text-green-500">{registerSuccess}</p>}
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isRegisterLoading}>
                                {isRegisterLoading ? "Creando cuenta..." : "Crear Cuenta"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}