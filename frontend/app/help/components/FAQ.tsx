import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpContentWrapper } from "./HelpContentWrapper";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Search, FileQuestion, FileCode, BarChart4, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

// Data spesifik untuk Statify
const faqs = [
  {
    question: "Apa itu file .sav?",
    answer: "File .sav adalah format file data yang digunakan oleh SPSS (Statistical Package for the Social Sciences). Statify dapat membaca dan menulis file format ini, memungkinkan interoperabilitas dengan SPSS."
  },
  {
    question: "Bagaimana cara mengimpor data dari Excel?",
    answer: "Untuk mengimpor data dari Excel, klik menu 'File' kemudian pilih 'Import Excel'. Anda dapat menyesuaikan pengaturan impor seperti sheet yang akan dibaca, baris header, dan tipe data variabel."
  },
  {
    question: "Bagaimana cara melakukan analisis deskriptif?",
    answer: "Untuk melakukan analisis deskriptif, pilih variabel yang ingin dianalisis dari panel variabel, kemudian klik menu 'Analyze' dan pilih 'Descriptive Statistics'. Anda dapat memilih statistik yang ingin ditampilkan seperti mean, median, modus, dan deviasi standar."
  },
  {
    question: "Apakah Statify dapat membuat grafik?",
    answer: "Ya, Statify dilengkapi dengan berbagai jenis grafik seperti bar chart, histogram, scatter plot, dan box plot. Anda dapat membuat grafik dengan memilih menu 'Graphs' dan kemudian memilih jenis grafik yang diinginkan."
  },
  {
    question: "Bagaimana cara melakukan uji hipotesis?",
    answer: "Untuk melakukan uji hipotesis, pilih menu 'Analyze', kemudian pilih jenis uji yang sesuai seperti T-Test, ANOVA, atau Chi-Square. Pilih variabel yang relevan dan sesuaikan parameter uji sesuai kebutuhan."
  },
  {
    question: "Apakah Statify menyimpan data secara otomatis?",
    answer: "Ya, Statify memiliki fitur autosave yang akan menyimpan pekerjaan Anda secara otomatis jika aplikasi mendeteksi Anda tidak aktif untuk beberapa waktu. Meskipun begitu, kami tetap menyarankan untuk menyimpan pekerjaan Anda secara berkala dengan mengklik 'File' > 'Save' atau menggunakan shortcut Ctrl+S (Windows) atau Cmd+S (Mac)."
  },
  {
    question: "Bagaimana cara mengekspor hasil analisis?",
    answer: "Hasil analisis dapat diekspor dalam format PDF, Excel, atau gambar. Klik kanan pada output hasil analisis dan pilih opsi 'Export', kemudian pilih format yang diinginkan."
  },
  {
    question: "Bagaimana cara menangani data yang hilang dalam analisis?",
    answer: "Dalam analisis statistik di Statify, Anda dapat memilih cara menangani missing values pada setiap jenis analisis. Di kotak dialog analisis, Anda dapat memilih opsi seperti 'Exclude cases pairwise', 'Exclude cases listwise', atau menggunakan metode estimasi tertentu sesuai dengan kebutuhan analisis Anda."
  }
];

// Pengelompokan FAQ berdasarkan kategori
const faqCategories = [
  {
    name: "Data & File",
    icon: <FileCode className="h-5 w-5 mr-2 text-primary/70" />,
    faqs: [faqs[0], faqs[1], faqs[5], faqs[6]]
  },
  {
    name: "Analisis Statistik",
    icon: <BarChart4 className="h-5 w-5 mr-2 text-primary/70" />,
    faqs: [faqs[2], faqs[3], faqs[4], faqs[7]]
  }
];

export const FAQ = () => {
  return (
    <HelpContentWrapper
      title="Pertanyaan yang Sering Diajukan"
      description="Temukan jawaban untuk pertanyaan umum tentang penggunaan Statify."
    >
      <Card className="bg-primary/5 border-primary/10 mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center">
              <HelpCircle className="text-primary h-6 w-6 mr-3" />
              <h3 className="text-lg font-medium">Tidak menemukan yang Anda cari?</h3>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="outline" size="sm" className="h-9">
                <Search className="h-4 w-4 mr-2" />
                Cari Bantuan
              </Button>
              <Button variant="default" size="sm" className="h-9">
                <FileQuestion className="h-4 w-4 mr-2" />
                Hubungi Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-8">
        {faqCategories.map((category, idx) => (
          <div key={idx}>
            <h3 className="text-lg font-medium mb-3 pb-2 border-b flex items-center">
              {category.icon}
              {category.name}
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {category.faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${category.name}-${index}`}
                  className="border-b border-border/50"
                >
                  <AccordionTrigger className="text-left font-medium hover:text-primary py-3 text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground py-2 pb-4 text-sm leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
      
      <Card className="mt-10 border-primary/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-base font-medium">Fitur Autosave</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Statify menyimpan pekerjaan Anda secara otomatis saat aplikasi mendeteksi periode tidak aktif. 
            Ini membantu mencegah kehilangan data jika aplikasi ditutup tanpa sengaja.
          </p>
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Save className="h-3.5 w-3.5" />
            <span>Pekerjaan terakhir disimpan otomatis</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-10 pt-5 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between">
        <p className="text-sm text-muted-foreground mb-4 sm:mb-0">Apakah informasi ini membantu?</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Ya
          </Button>
          <Button variant="outline" size="sm">
            Tidak
          </Button>
        </div>
      </div>
    </HelpContentWrapper>
  );
}; 