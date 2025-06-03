"use client";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import React from "react"; // Import React for JSX and ChangeEvent type

// Define the type for a section item, exported for use in page.tsx as well
export interface SectionItem {
  key: string;
  label: string;
  content: React.JSX.Element;
}

interface HelpContentProps {
  sections: SectionItem[]; // The original full list of sections for rendering main content
  selectedSectionKey: string;
  onSectionSelect: (key: string) => void;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  displaySections: SectionItem[]; // Sections to display in the sidebar (filtered or all)
}

export default function HelpContent({
  sections,
  selectedSectionKey,
  onSectionSelect,
  searchValue,
  onSearchChange,
  displaySections,
}: HelpContentProps) {
  return (
    <div className="flex max-w-7xl mx-auto py-8 px-2 sm:px-3 gap-4 sm:gap-6 min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border rounded-lg bg-white shadow-sm p-3 h-fit sticky top-8">
        <h2 className="text-lg font-semibold mb-3">Documentation</h2>
        <div className="relative mb-4">
          <Input
            placeholder="Search documentation..."
            value={searchValue}
            onChange={onSearchChange}
            className="pr-8"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {displaySections.length === 0 && (
          <div className="text-center py-3 text-gray-500 text-sm">
            No results found
          </div>
        )}
        <nav>
          <ul className="space-y-1">
            {displaySections.map((section) => (
              <li key={section.key}>
                <button
                  className={`w-full text-left px-2 py-2 rounded-md transition duration-200 ${
                    selectedSectionKey === section.key 
                      ? "bg-blue-50 text-blue-700 font-medium" 
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => onSectionSelect(section.key)}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Need more help?</h3>
          <a href="mailto:support@statify.com" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Support
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-white p-5 sm:p-6 rounded-lg shadow-sm border">
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex text-sm text-gray-500">
            <li><a href="#" className="hover:text-gray-700">Home</a></li>
            <li className="mx-2">/</li>
            <li><a href="#" className="hover:text-gray-700">Documentation</a></li>
            <li className="mx-2">/</li>
            {sections.map(section => 
              section.key === selectedSectionKey && (
                <li key={section.key} className="font-medium text-gray-900">{section.label}</li>
              )
            )}
          </ol>
        </nav>

        <h1 className="text-3xl font-bold mb-2">Statify Help & Documentation</h1>
        <p className="text-gray-600 mb-5">
          Welcome to the Statify documentation. Here you'll find answers to common
          questions and guides to help you get started.
        </p>
        <Separator className="mb-6" />

        <section>
          {sections.map(
            (section) =>
              section.key === selectedSectionKey && (
                <div key={section.key} className="animate-fadeIn">
                  <h2 className="text-2xl font-semibold mb-5">
                    {section.label}
                  </h2>
                  <div className="prose max-w-none">{section.content}</div>
                </div>
              )
          )}
        </section>
        
        <div className="mt-8 pt-4 border-t flex justify-between text-sm">
          <div>
            Was this helpful?
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 border rounded-md hover:bg-gray-50">Yes</button>
              <button className="px-3 py-1 border rounded-md hover:bg-gray-50">No</button>
            </div>
          </div>
          <div>
            <a href="#" className="text-blue-600 hover:underline flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Back to top
            </a>
          </div>
        </div>
      </main>
    </div>
  );
} 