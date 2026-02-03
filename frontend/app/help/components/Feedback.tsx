import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpGuideTemplate } from "../ui/HelpGuideTemplate";
import { HelpCard, HelpAlert, HelpStep } from "../ui/HelpLayout";
import { SendHorizontal, Star, ThumbsUp, MessageSquare, Mail, BookOpen, ListOrdered } from "lucide-react";

export const Feedback = () => {
  const sections = [
    {
      id: 'how-to-feedback',
      title: 'Cara Memberikan Umpan Balik',
      description: 'Panduan langkah demi langkah untuk menyampaikan umpan balik yang efektif',
      icon: ListOrdered,
      content: (
        <div className="space-y-4">
          <HelpStep number={1} title="Tentukan Jenis Umpan Balik">
            <p className="text-sm">
              Pilih kategori yang paling sesuai dengan umpan balik Anda:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li><strong>Permintaan Fitur</strong>: Saran untuk fitur baru atau perbaikan</li>
              <li><strong>Laporan Bug</strong>: Melaporkan masalah atau error dalam aplikasi</li>
              <li><strong>Umpan Balik Umum</strong>: Pengalaman pengguna dan saran keseluruhan</li>
            </ul>
          </HelpStep>

          <HelpStep number={2} title="Siapkan Informasi Detail">
            <p className="text-sm">
              Untuk laporan bug, siapkan informasi berikut:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm space-y-1">
              <li>Langkah-langkah untuk mereproduksi masalah</li>
              <li>Screenshot atau video jika memungkinkan</li>
              <li>Pesan error yang muncul (jika ada)</li>
              <li>Browser dan sistem operasi yang digunakan</li>
            </ul>
          </HelpStep>

          <HelpStep number={3} title="Isi Formulir dengan Lengkap">
            <p className="text-sm">
              Berikan deskripsi yang jelas dan spesifik. Semakin detail informasi yang Anda 
              berikan, semakin mudah bagi tim kami untuk memahami dan menindaklanjuti.
            </p>
          </HelpStep>

          <HelpStep number={4} title="Kirim dan Tunggu Respons">
            <p className="text-sm">
              Setelah mengirim umpan balik, tim kami akan meninjau dan merespons dalam 1-2 hari kerja. 
              Jika Anda menyertakan email, kami akan menghubungi Anda jika diperlukan.
            </p>
          </HelpStep>
        </div>
      )
    },
    {
      id: 'overview',
      title: 'Jenis Umpan Balik',
      description: 'Pilih jenis umpan balik yang sesuai dengan kebutuhan Anda',
      icon: BookOpen,
      content: (
        <div className="grid gap-4 md:grid-cols-3">
          <HelpCard title="Permintaan Fitur" icon={ThumbsUp} variant="feature">
            <p className="text-sm text-muted-foreground">
              Saran untuk fitur baru atau perbaikan yang dapat meningkatkan alur kerja Anda.
            </p>
          </HelpCard>
          
          <HelpCard title="Laporan Bug" icon={MessageSquare} variant="feature">
            <p className="text-sm text-muted-foreground">
              Laporkan masalah atau perilaku yang tidak terduga dalam aplikasi.
            </p>
          </HelpCard>
          
          <HelpCard title="Umpan Balik Umum" icon={Star} variant="feature">
            <p className="text-sm text-muted-foreground">
              Bagikan pengalaman dan pendapat Anda secara keseluruhan tentang Statify.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'feedback-form',
      title: 'Kirim Umpan Balik Anda',
      description: 'Kami terus meningkatkan Statify berdasarkan masukan pengguna',
      icon: Mail,
      content: (
        <div className="space-y-6">
          <HelpAlert variant="info" title="Umpan Balik Anda Penting">
            <p className="text-sm mt-2">
              Setiap umpan balik yang Anda berikan membantu kami membuat Statify menjadi lebih baik. 
              Tim kami akan meninjau setiap pengajuan dengan cermat.
            </p>
          </HelpAlert>
          
          <HelpCard title="Formulir Umpan Balik" variant="step">
            <form className="space-y-4 max-w-full">
              <div className="grid gap-4 md:grid-cols-2 w-full">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm">Nama</Label>
                  <Input
                    id="name"
                    placeholder="Nama Anda"
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm">Email (opsional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="anda@contoh.com"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="feedbackType" className="text-sm">Jenis Umpan Balik</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis umpan balik" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="feature">Permintaan Fitur</SelectItem>
                      <SelectItem value="bug">Laporan Bug</SelectItem>
                      <SelectItem value="general">Umpan Balik Umum</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="subject" className="text-sm">Subjek</Label>
                <Input
                  id="subject"
                  placeholder="Ringkasan singkat umpan balik Anda"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="message" className="text-sm">Pesan</Label>
                <Textarea
                  id="message"
                  placeholder="Jelaskan masalah atau saran Anda secara detail..."
                  className="min-h-[120px] resize-y w-full"
                  required
                />
              </div>
              
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox id="contactConsent" className="mt-1" />
                <Label htmlFor="contactConsent" className="text-sm text-muted-foreground">
                  Saya setuju untuk dihubungi terkait umpan balik ini jika diperlukan
                </Label>
              </div>
              
              <div className="pt-2">
                <Button type="submit" className="w-full sm:w-auto">
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Kirim Umpan Balik
                </Button>
              </div>
            </form>
          </HelpCard>
        </div>
      )
    }
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Umpan Balik Efektif untuk Bug',
      content: 'Berikan detail spesifik dan langkah-langkah untuk mereproduksi masalah. Sertakan screenshot atau video jika memungkinkan untuk memperjelas masalah.'
    },
    {
      type: 'info' as const,
      title: 'Waktu Respons Tim',
      content: 'Tim kami biasanya merespons umpan balik dalam 1-2 hari kerja. Untuk masalah kritis, gunakan saluran dukungan prioritas.'
    },
    {
      type: 'warning' as const,
      title: 'Informasi Sensitif',
      content: 'Jangan sertakan informasi pribadi atau data sensitif dalam umpan balik. Gunakan data contoh atau samaran jika diperlukan.'
    },
    {
      type: 'tip' as const,
      title: 'Follow-up Umpan Balik',
      content: 'Jika menyertakan email, Anda akan mendapat notifikasi ketika umpan balik Anda ditindaklanjuti atau butuh klarifikasi tambahan.'
    }
  ];

  const relatedTopics = [
    { title: 'FAQ - Pertanyaan Umum', href: '/help/faq' },
    { title: 'Memulai', href: '/help/getting-started' },
    { title: 'Panduan Pengguna', href: '/help/user-guide' },
    { title: 'Panduan File', href: '/help/file-guide' },
    { title: 'Panduan Data', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Umpan Balik & Dukungan"
      description="Bantu kami meningkatkan Statify dengan membagikan pengalaman, saran, atau melaporkan masalah yang Anda temui"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};