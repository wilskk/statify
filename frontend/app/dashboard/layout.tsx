"use client"; // Make this layout a Client Component

// app/dashboard/layout.tsx
import "@/app/globals.css";
import Header from "@/components/layout/dashboard/Header";
import Footer from "@/components/layout/dashboard/Footer";
import React from "react";
import ModalContainer from "@/components/Modals/ModalContainer";
import DataLoader from "@/components/ui/DataLoader";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useMobile } from "@/hooks/useMobile";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const { shouldPrompt } = useMobile();

    return (
        <>
            <DataLoader />

            <div className="h-screen w-full flex flex-col">
                <header className="flex-shrink-0 z-50">
                   <Header />
                </header>
                <main className="flex-grow overflow-y-auto relative bg-muted hide-scrollbar-x">
                    <LoadingOverlay>
                        {children}
                    </LoadingOverlay>
                    <ModalContainer />
                </main>
                <footer className="flex-shrink-0 border-t border-border">
                    <Footer />
                </footer>
            </div>
        </>
    );
}