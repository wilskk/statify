"use client";

import React, { useState } from 'react';
import Navbar from './Navbar';
import Toolbar from './Toolbar';

export default function Header() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string>('A1');

    const toggleSidebar = () => {
        setIsSidebarOpen((prevState) => !prevState);
    };

    return (
        <header className="w-full bg-white border-b border-[#E6E6E6] flex-shrink-0">
            <Navbar />
            <Toolbar
                selectedValue={selectedValue}
                onSelectedValueChange={setSelectedValue}
            />
        </header>
    );
}