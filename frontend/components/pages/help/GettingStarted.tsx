import React from "react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FileVideo, User, Database, BarChart, Bell, LayoutDashboard, Lightbulb } from "lucide-react";

export const GettingStarted = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Memulai dengan Statify</h2>
        <p className="text-muted-foreground mb-6">
          Ikuti langkah-langkah berikut untuk mulai menggunakan alat analisis Statify yang canggih:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-md bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="mb-2">Daftar Akun</CardTitle>
                <CardDescription>Buat akun Statify baru atau masuk dengan kredensial yang ada.</CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-md bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="mb-2">Hubungkan Data</CardTitle>
                <CardDescription>Sambungkan sumber data Anda menggunakan wizard integrasi kami.</CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-md bg-primary/10">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="mb-2">Jelajahi Dashboard</CardTitle>
                <CardDescription>Lihat wawasan dari dashboard yang dipersonalisasi untuk Anda.</CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-md bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="mb-2">Atur Notifikasi</CardTitle>
                <CardDescription>Konfigurasi peringatan dan notifikasi untuk metrik penting Anda.</CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-900">
        <Lightbulb className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-amber-800">Tips Profesional</AlertTitle>
        <AlertDescription className="text-amber-700">
          Coba kumpulan data sampel kami untuk menjelajahi fitur Statify sebelum menghubungkan data Anda sendiri.
        </AlertDescription>
      </Alert>

      <div className="mt-8 border-t pt-6">
        <h3 className="text-xl font-semibold mb-4">Video Tutorial</h3>
        <Card className="overflow-hidden">
          <div className="aspect-video bg-muted/30 flex items-center justify-center">
            <FileVideo className="h-12 w-12 text-muted" />
          </div>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Tonton video tutorial kami untuk membantu memulai dengan cepat. Video ini menjelaskan semua fitur dasar Statify.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 