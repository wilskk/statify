"use client"; // Make this layout a Client Component

// app/dashboard/layout.tsx
import "@/app/globals.css";
import Header from "@/components/layout/dashboard/Header";
import Footer from "@/components/layout/dashboard/Footer";
import React, { useState } from "react"; // Removed unused useEffect and useRef
import DataLoader from "@/components/ui/DataLoader";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { useMobile } from "@/hooks/useMobile";
import { useModalStore } from "@/stores/useModalStore";
import SidebarContainer from "@/components/layout/dashboard/SidebarContainer";
// Import ModalContainer for mobile dialogs
import ModalContainer from "@/components/Modals/ModalContainer"; 
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

// Default sidebar width percentage
const DEFAULT_SIDEBAR_WIDTH = 35;
const MIN_SIDEBAR_WIDTH = 20;
const MAX_SIDEBAR_WIDTH = 70;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isMobile } = useMobile(); // Get isMobile from the hook
    const modals = useModalStore((state) => state.modals);
    const hasOpenModal = modals.length > 0;
    
    // Stores the current or last known width of the sidebar when it's open.
    const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);

    // Key to force ResizablePanelGroup re-mount on major state changes (mobile/desktop, sidebar open/closed)
    // This ensures defaultSize is correctly applied during transitions.
    const desktopPanelGroupKey = isMobile ? 'mobile' : (hasOpenModal ? 'desktop-sidebar-open' : 'desktop-sidebar-closed');

    return (
        <>
            <DataLoader />

            <div className="h-screen w-full flex flex-col">
                <header className="flex-shrink-0 z-50">
                   <Header />
                </header>
                <main className="flex-grow overflow-hidden relative bg-muted">
                    {isMobile ? (
                        // Mobile View: Main content takes full width, modals are standard dialogs.
                        <div className="h-full overflow-y-auto hide-scrollbar-x">
                            <LoadingOverlay>
                                {children}
                            </LoadingOverlay>
                            {/* Render ModalContainer for dialogs on mobile if a modal is open */}
                            {hasOpenModal && <ModalContainer containerType="dialog" />}
                        </div>
                    ) : (
                        // Desktop View: Resizable panel group for main content and sidebar.
                        <ResizablePanelGroup 
                            direction="horizontal"
                            key={desktopPanelGroupKey} 
                        >
                            <ResizablePanel 
                                defaultSize={hasOpenModal ? (100 - sidebarWidth) : 100}
                                minSize={hasOpenModal ? (100 - MAX_SIDEBAR_WIDTH) : 100} 
                                maxSize={hasOpenModal ? (100 - MIN_SIDEBAR_WIDTH) : 100}
                                order={1}
                                className="transition-all duration-300 ease-in-out"
                            >
                                <div className="h-full overflow-y-auto hide-scrollbar-x">
                                    <LoadingOverlay>
                                        {children}
                                    </LoadingOverlay>
                                </div>
                            </ResizablePanel>
                            
                            {/* Handle is only rendered when the sidebar is active */} 
                            {hasOpenModal && <ResizableHandle withHandle className="bg-border" />}
                            
                            <ResizablePanel 
                                defaultSize={hasOpenModal ? sidebarWidth : 0} // Collapses if no modal
                                minSize={hasOpenModal ? MIN_SIDEBAR_WIDTH : 0} 
                                maxSize={hasOpenModal ? MAX_SIDEBAR_WIDTH : 0}
                                onResize={(size) => {
                                    // Only allow resizing and state update if the sidebar is supposed to be open
                                    if (hasOpenModal) {
                                        setSidebarWidth(size);
                                    }
                                }}
                                collapsible={true}
                                collapsedSize={0}
                                order={2}
                                // className={!hasOpenModal ? "min-w-0 w-0" : "transition-all duration-300 ease-in-out"} // Optional: for smoother transitions. Removed direct w-0 styling.
                                className="transition-all duration-300 ease-in-out" // Optional: for smoother visual transitions
                            >
                                {/* Render SidebarContainer only if there's a modal to avoid empty space processing */} 
                                {hasOpenModal && <SidebarContainer />}
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