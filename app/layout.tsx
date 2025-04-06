// app/layout.tsx
import type { Metadata } from "next";
import '@/app/globals.css'
import React from "react";

export const metadata: Metadata = {
    title: "Statify",
    description: "Statistical analysis application",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <head />
        <body className={"h-full w-full m-0 p-0 grid grid-rows-[auto_1fr_auto] overflow-y-auto"}>
        <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
                {children}
            </main>
        </div>
        </body>
        </html>
    );
}