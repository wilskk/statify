"use client";

import React, { useState } from 'react';
import Navbar from './Navbar';
import Toolbar from './Toolbar';

export default function Header() {

    return (
        <header className="w-full bg-white border-b border-[#E6E6E6] flex-shrink-0">
            <Navbar />
            <Toolbar/>
        </header>
    );
}