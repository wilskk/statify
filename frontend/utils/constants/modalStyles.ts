/**
 * modalStyles - Style yang konsisten untuk semua modal
 * 
 * Satu tempat untuk mengelola style semua modal, menjamin konsistensi
 * visual di seluruh aplikasi.
 */
export const modalStyles = {
    // Containers
    dialogContent: "bg-popover p-0 shadow-[0px_4px_12px_rgba(0,0,0,0.08)]",
    dialogHeader: "bg-muted px-6 py-5 border-b border-border h-16",
    dialogBody: "px-6 py-6",
    dialogFooter: "bg-muted px-6 py-5 border-t border-border h-16",

    // Typography
    dialogTitle: "text-lg font-semibold text-popover-foreground",
    dialogDescription: "text-sm text-muted-foreground",

    // Buttons
    primaryButton: "bg-primary text-primary-foreground hover:opacity-90 h-8",
    secondaryButton: "border-border text-secondary-foreground hover:bg-accent h-8",

    // Form elements
    formGroup: "space-y-2 mb-6",
    label: "text-foreground text-xs font-medium",
    input: "h-10 border-input focus:border-ring",
    
    // Sidebar specific
    sidebarHeader: "border-b border-border p-4 flex justify-between items-center",
    sidebarTitle: "text-lg font-semibold",
    sidebarBody: "p-4",
    sidebarFooter: "border-t border-border p-4 flex justify-end gap-2",
};

/**
 * getContainerClasses - Mendapatkan kelas CSS berdasarkan jenis container
 * 
 * Membantu komponen modal untuk memberikan style yang tepat
 * berdasarkan apakah modal ditampilkan sebagai dialog atau sidebar.
 * 
 * @param containerType - Jenis container (dialog/sidebar)
 * @returns Object dengan kelas CSS yang sesuai
 */
export function getContainerClasses(containerType: "dialog" | "sidebar") {
    if (containerType === "dialog") {
        return {
            content: modalStyles.dialogContent,
            header: modalStyles.dialogHeader,
            body: modalStyles.dialogBody,
            footer: modalStyles.dialogFooter,
            title: modalStyles.dialogTitle,
        };
    }
    
    return {
        content: "", // Sidebar biasanya full width
        header: modalStyles.sidebarHeader,
        body: modalStyles.sidebarBody,
        footer: modalStyles.sidebarFooter,
        title: modalStyles.sidebarTitle,
    };
} 