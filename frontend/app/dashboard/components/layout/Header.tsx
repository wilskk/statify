"use client";

import React from 'react';
import Navbar from './Navbar'; // Desktop Menubar
import Toolbar from '../../data/components/Toolbar';
import HamburgerMenu from './HamburgerMenu'; // Mobile Drawer Menu
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();
    const showToolbar = pathname === '/dashboard/data';

    return (
        <header className="w-full bg-background flex flex-col flex-shrink-0">
            {/* Desktop Navbar */}
            <div className="hidden md:block">
                <Navbar />
            </div>

            {/* Mobile Hamburger Menu */}
            <div className="block md:hidden">
                <HamburgerMenu />
            </div>

            {/* Toolbar hanya tampil di halaman data */}
            {showToolbar && (
                <div className="border-t border-border">
                    <Toolbar />
                </div>
            )}
        </header>
    );
}