"use client";

import React, { useState } from 'react';
import Navbar from './Navbar';
import Toolbar from './Toolbar';

export default function Header() {

    return (
        <header className="w-full bg-white border-b border-[#E6E6E6] flex flex-col flex-shrink-0">
            {/* Wrapper untuk Navbar agar bisa scroll horizontal */}
            <div className="w-full overflow-x-auto hide-scrollbar-x">
                <Navbar />
            </div>
            {/* Wrapper untuk Toolbar agar bisa scroll horizontal */}
            <div className="w-full overflow-x-auto hide-scrollbar-x border-t border-[#E6E6E6]">
                 <Toolbar/>
            </div>
        </header>
    );
}