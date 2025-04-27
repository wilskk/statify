// app/dashboard/layout.tsx
import "@/app/globals.css";
import Header from "@/components/layout/dashboard/Header";
import Footer from "@/components/layout/dashboard/Footer";
import React from "react";
import ModalContainer from "@/components/Modals/ModalContainer";
import DataLoader from "@/components/ui/DataLoader";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <DataLoader />

            <div className="h-screen w-full flex flex-col overflow-hidden">
                <header className="flex-shrink-0 z-50">
                    <Header />
                </header>
                <main className="flex-grow overflow-y-auto relative bg-[#F7F7F7] hide-scrollbar-x">
                    <LoadingOverlay>
                        {children}
                    </LoadingOverlay>
                    <ModalContainer />
                </main>
                <footer className="flex-shrink-0 border-t">
                    <Footer />
                </footer>
            </div>
        </>
    );
}