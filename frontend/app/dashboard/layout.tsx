"use client"; // Make this layout a Client Component

import "@/app/globals.css";
import Header from "@/components/layout/dashboard/Header";
import Footer from "@/components/layout/dashboard/Footer";
import React, { useState, lazy, Suspense } from "react";
import DataLoader from "@/components/ui/DataLoader";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useMobile } from "@/hooks/useMobile";
import { useModal } from "@/hooks/useModal";
import dynamic from 'next/dynamic';
const SyncStatusClient = dynamic(() => import('@/components/ui/SyncStatus'), { ssr: false });
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

// Lazy load ModalManager untuk performa yang lebih baik
const ModalManager = lazy(() => import("@/components/Modals/ModalManager"));

// Komponen fallback saat ModalManager sedang dimuat
const ModalLoading = () => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary"></div>
  </div>
);

// Pengaturan lebar sidebar
const DEFAULT_SIDEBAR_WIDTH = 30; // Persentase default lebar sidebar
const MIN_SIDEBAR_WIDTH = 0;      // Tidak ada lebar minimum sidebar
const MAX_SIDEBAR_WIDTH = 60;     // Persentase maksimum lebar sidebar

/**
 * DashboardLayout - Layout utama untuk halaman dashboard
 * 
 * Layout ini menangani:
 * - Tampilan header dan footer
 * - Tampilan konten utama dashboard
 * - Manajemen sidebar untuk modal (pada desktop)
 * - Manajemen dialog modal (pada mobile)
 * - Responsivitas antara tampilan desktop dan mobile
 */
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isMobile } = useMobile(); // Deteksi device mobile
    const { modals } = useModal();
    // Auto-sync is now triggered within the client-only Footer component
    const hasOpenModal = modals.length > 0;
    
    // State untuk mengingat lebar sidebar ketika terbuka
    const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);

    // Key untuk memaksa ResizablePanelGroup re-mount saat perubahan state
    // Ini memastikan defaultSize diterapkan dengan benar selama transisi
    const desktopPanelGroupKey = isMobile ? 'mobile' : (hasOpenModal ? 'desktop-sidebar-open' : 'desktop-sidebar-closed');

    // ID modal teratas untuk filter tampilan
    const topModalId = modals.length > 0 ? modals[modals.length - 1].id : null;

    // Filter untuk hanya menampilkan modal teratas
    const showOnlyTopModal = (modalId: string) => {
        return topModalId === modalId;
    };

    return (
        <>
            <DataLoader />

            <div className="h-screen w-full flex flex-col dashboard-layout">
                <header className="flex-shrink-0 z-50 flex items-center justify-between">
                   <Header />
                   <SyncStatusClient />
                </header>
                <main className="flex-grow overflow-hidden relative bg-muted w-full">
                    {isMobile ? (
                        // Tampilan Mobile: Konten utama penuh lebar, modal sebagai dialog
                        <div className="h-full overflow-y-auto hide-scrollbar-x">
                            <LoadingOverlay>
                                {children}
                            </LoadingOverlay>
                            {/* Render modal sebagai dialog di mobile */}
                            {hasOpenModal && (
                                <Suspense fallback={<ModalLoading />}>
                                    <ModalManager 
                                        customFilter={showOnlyTopModal} 
                                        containerType="dialog" 
                                    />
                                </Suspense>
                            )}
                        </div>
                    ) : (
                        // Tampilan Desktop: Panel yang dapat diubah ukurannya untuk konten utama dan sidebar
                        <ResizablePanelGroup 
                            direction="horizontal"
                            key={desktopPanelGroupKey}
                            className="overflow-hidden w-full"
                        >
                            <ResizablePanel 
                                defaultSize={hasOpenModal ? (100 - sidebarWidth) : 100}
                                minSize={hasOpenModal ? (100 - MAX_SIDEBAR_WIDTH) : 100} 
                                maxSize={hasOpenModal ? (100 - MIN_SIDEBAR_WIDTH) : 100}
                                order={1}
                                className="transition-all duration-300 ease-in-out"
                            >
                                <div className="h-full overflow-y-auto overflow-x-hidden w-full">
                                    <LoadingOverlay>
                                        {children}
                                    </LoadingOverlay>
                                </div>
                            </ResizablePanel>
                            
                            {/* Handle hanya ditampilkan ketika sidebar aktif */} 
                            {hasOpenModal && <ResizableHandle withHandle className="bg-border" />}
                            
                            <ResizablePanel 
                                defaultSize={hasOpenModal ? sidebarWidth : 0} // Collapse jika tidak ada modal
                                minSize={hasOpenModal ? MIN_SIDEBAR_WIDTH : 0} 
                                maxSize={hasOpenModal ? MAX_SIDEBAR_WIDTH : 0}
                                onResize={(size) => {
                                    // Hanya izinkan resize dan update state jika sidebar seharusnya terbuka
                                    if (hasOpenModal) {
                                        setSidebarWidth(size);
                                    }
                                }}
                                collapsible={true}
                                collapsedSize={0}
                                order={2}
                                className="transition-all duration-300 ease-in-out"
                            >
                                {/* Render modal sebagai sidebar panel di desktop */}
                                {hasOpenModal && (
                                    <Suspense fallback={<ModalLoading />}>
                                        <div className="h-full w-full resize-content">
                                            <ModalManager 
                                                customFilter={showOnlyTopModal} 
                                                containerType="sidebar" 
                                            />
                                        </div>
                                    </Suspense>
                                )}
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    )}
                </main>
                <footer className="flex-shrink-0 border-t border-border">
                    <Footer />
                </footer>
            </div>
        </>
    );
}