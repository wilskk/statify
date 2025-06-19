import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SendHorizontal } from "lucide-react";

export const Feedback = () => {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Kirim Masukan</CardTitle>
        <CardDescription>
          Kami sangat menghargai masukan Anda dan terus berupaya meningkatkan Statify berdasarkan saran Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email Anda (opsional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="anda@contoh.com"
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feedbackType">Jenis Masukan</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis masukan" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="feature">Permintaan Fitur</SelectItem>
                  <SelectItem value="bug">Laporan Bug</SelectItem>
                  <SelectItem value="general">Masukan Umum</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Pesan</Label>
            <Textarea
              id="message"
              placeholder="Jelaskan masalah atau saran Anda..."
              className="min-h-[120px] resize-y"
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="contactConsent" />
            <Label htmlFor="contactConsent" className="text-sm">
              Saya setuju untuk dihubungi terkait masukan ini
            </Label>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full sm:w-auto">
          <SendHorizontal className="mr-2 h-4 w-4" />
          Kirim Masukan
        </Button>
      </CardFooter>
    </Card>
  );
}; 