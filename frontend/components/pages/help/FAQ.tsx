import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "Bagaimana cara reset kata sandi?",
    answer: "Buka pengaturan akun Anda dan klik \"Reset Kata Sandi\". Anda akan menerima email dengan instruksi untuk membuat kata sandi baru."
  },
  {
    question: "Dapatkah saya mengundang anggota tim?",
    answer: "Ya, Anda dapat mengundang anggota tim dari bagian Tim. Setiap anggota dapat diberi level izin yang berbeda."
  },
  {
    question: "Format file apa saja yang didukung untuk diimpor?",
    answer: "Statify mendukung CSV, Excel (.xlsx), JSON, dan koneksi database langsung melalui konektor kami."
  },
  {
    question: "Apakah data saya aman?",
    answer: "Ya, kami menggunakan enkripsi dan langkah-langkah keamanan standar industri. Data Anda disimpan dengan aman dan tidak pernah dibagikan."
  },
  {
    question: "Dapatkah saya ekspor hasil analisis saya?",
    answer: "Ya, Anda dapat mengekspor hasil dalam berbagai format termasuk PDF, Excel, CSV, dan gambar untuk grafik dan visualisasi."
  },
  {
    question: "Bagaimana cara menghubungi dukungan teknis?",
    answer: "Anda dapat menghubungi dukungan teknis kami melalui menu Bantuan > Kontak Dukungan, atau mengirim email ke support@statify.id."
  }
];

export const FAQ = () => {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Pertanyaan yang Sering Diajukan</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}; 