"use client";

import React from 'react';
import Navbar from './Navbar'; // Desktop Menubar
import Toolbar from './Toolbar';
import HamburgerMenu from './HamburgerMenu'; // Mobile Drawer Menu
import { useMobile } from "@/hooks/useMobile"; // Import the hook
import { usePathname } from 'next/navigation';

export default function Header() {
    const { isMobile } = useMobile(); // Use the hook
    const pathname = usePathname();
    const showToolbar = pathname === '/dashboard/data';

    return (
        <header className="w-full bg-background flex flex-col flex-shrink-0">
            {/* Conditionally render Navbar or HamburgerMenu */}
            {isMobile ? <HamburgerMenu /> : <Navbar />}
            
            {/* Toolbar hanya tampil di halaman data */}
            {showToolbar && (
                <div className="border-t border-border">
                     <Toolbar/>
                </div>
            )}
        </header>
    );
}