"use client";

import React from 'react';
import Navbar from './Navbar'; // Desktop Menubar
import Toolbar from './Toolbar';
import HamburgerMenu from './HamburgerMenu'; // Mobile Drawer Menu
import { useMobile } from "@/hooks/useMobile"; // Import the hook

export default function Header() {
    const { isMobile } = useMobile(); // Use the hook

    return (
        <header className="w-full bg-background flex flex-col flex-shrink-0">
            {/* Conditionally render Navbar or HamburgerMenu */}
            {isMobile ? <HamburgerMenu /> : <Navbar />}
            
            {/* Remove outer overflow wrappers - Toolbar handles its own scroll */}
            <div className="border-t border-border">
                 <Toolbar/>
            </div>
        </header>
    );
}