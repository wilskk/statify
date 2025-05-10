"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, Menu, X, ChevronRight, BarChart2, LayoutGrid, BookOpen, Users } from 'lucide-react';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useState } from 'react';

export default function LandingHeader() {
    const [open, setOpen] = useState(false);

    const navItems = [
        { name: 'Fitur', href: '#features', icon: <BarChart2 className="h-5 w-5" /> },
        { name: 'Perbandingan', href: '#comparison', icon: <LayoutGrid className="h-5 w-5" /> },
        { name: 'Testimoni', href: '#testimonials', icon: <Users className="h-5 w-5" /> },
        { name: 'Dokumentasi', href: '#docs', icon: <BookOpen className="h-5 w-5" /> },
    ];

    return (
        <nav className="border-b border-border py-2 w-full fixed top-0 z-50 bg-background shadow-sm">
            <div className="container mx-auto px-4 md:px-8 flex justify-between items-center h-16">
                {/* Logo sesuai dengan identitas brand */}
                <Link href="/public" className="font-bold text-xl tracking-tighter text-foreground">
                    <span className="bg-primary text-primary-foreground px-2 py-1 mr-1 rounded-sm">Stat</span>
                    <span>ify</span>
                </Link>

                {/* Desktop Navigation - menggunakan hierarki tipografi yang ditentukan */}
                <div className="hidden md:flex">
                    <NavigationMenu className="mx-auto">
                        <NavigationMenuList>
                            {navItems.map((item) => (
                                <NavigationMenuItem key={item.name}>
                                    <Link href={item.href} legacyBehavior passHref>
                                        <NavigationMenuLink
                                            className={`px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 rounded-md`}
                                        >
                                            {item.name}
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Auth Button - Menggunakan warna primer sesuai dokumentasi */}
                <div className="hidden md:flex items-center">
                    <Link href="/dashboard/data">
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 rounded-md px-4 h-10 font-semibold"
                        >
                            <LogIn className="mr-2 h-4 w-4" />
                            <span>Masuk</span>
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu - Dengan warna monokromatik dan spacing yang konsisten */}
                <div className="md:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="text-foreground border-border hover:bg-accent transition-colors duration-200 rounded-md w-10 h-10 p-0">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[280px] p-0 bg-popover border-border">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Menu Navigasi Statify</SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col h-full">
                                {/* Header dengan Logo */}
                                <div className="p-4 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="bg-primary text-primary-foreground px-2 py-1 rounded-sm font-bold mr-1">Stat</div>
                                        <div className="text-popover-foreground font-bold">ify</div>
                                    </div>
                                    {/* Menggunakan tombol X bawaan dari shadcn/ui, tidak perlu menambahkan tombol kustom */}
                                </div>

                                {/* Judul Menu */}
                                <div className="px-4 py-3 bg-muted">
                                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Menu Navigasi</h2>
                                </div>

                                {/* Menu Navigasi */}
                                <div className="flex-1 overflow-auto">
                                    <nav className="flex flex-col">
                                        {navItems.map((item) => (
                                            <SheetClose asChild key={item.name}>
                                                <Link
                                                    href={item.href}
                                                    className="flex items-center px-4 py-4 text-muted-foreground hover:text-popover-foreground hover:bg-accent transition-colors duration-200 border-b border-border"
                                                >
                                                    <span className="bg-muted p-2 mr-4 rounded-md text-muted-foreground">{item.icon}</span>
                                                    <span className="font-medium">{item.name}</span>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                                                </Link>
                                            </SheetClose>
                                        ))}
                                    </nav>
                                </div>

                                {/* Auth Button - Mobile */}
                                <div className="p-4 border-t border-border bg-popover">
                                    <SheetClose asChild>
                                        <Link href="/dashboard/data">
                                            <Button
                                                className="w-full bg-primary text-primary-foreground hover:opacity-90 h-12 transition-colors duration-200 font-semibold flex items-center justify-center gap-2"
                                            >
                                                <LogIn className="h-4 w-4" /> Masuk
                                            </Button>
                                        </Link>
                                    </SheetClose>
                                </div>

                                {/* Footer Info */}
                                <div className="py-4 px-4 text-center text-xs text-muted-foreground bg-muted border-t border-border">
                                    Aplikasi Analisis Statistik Open Source
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}