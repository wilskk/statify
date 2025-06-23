import React, { cloneElement } from "react";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Recursive type for nested sections
export type SectionItem = {
	key: string;
	label: string;
	content?: React.ReactElement;
	children?: SectionItem[];
	parentKey?: string;
	childContent?: string; // Used by StatisticsGuide children
};

type HelpContentProps = {
	sections: SectionItem[];
	selectedSectionKey: string;
	activeChildKey: string | null;
	onSectionSelect: (key: string) => void;
	searchValue: string;
	onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	displaySections: SectionItem[];
	expandedKeys: Set<string>;
};

export const HelpContent: React.FC<HelpContentProps> = ({
	sections,
	selectedSectionKey,
	activeChildKey,
	onSectionSelect,
	searchValue,
	onSearchChange,
	displaySections,
	expandedKeys,
}) => {
	const renderSidebarItems = (items: SectionItem[], level = 0): React.JSX.Element[] => {
		return items.map(item => {
			const isSelected = item.key === selectedSectionKey;
			const isActiveChild = item.key === activeChildKey;
			const isExpanded = expandedKeys.has(item.key);
			const hasChildren = item.children && item.children.length > 0;

			return (
				<div key={item.key} className="animate-fadeIn" style={{ animationDelay: `${level * 50}ms` }}>
					<a
						href="#"
						onClick={e => {
							e.preventDefault();
							onSectionSelect(item.key);
						}}
						className={cn(
							"flex items-center justify-between w-full px-4 py-2.5 text-left rounded-md transition-all duration-200",
							isActiveChild
								? "bg-primary/10 text-primary font-medium"
								: isSelected && !activeChildKey && level === 0
								? "bg-accent text-accent-foreground font-medium"
								: "text-foreground/70 hover:bg-accent hover:text-accent-foreground",
							level > 0 && "text-sm"
						)}
						style={{ paddingLeft: `${1 + level * 1.5}rem` }}
					>
						<span>{item.label}</span>
						{hasChildren && (
							<ChevronRight
								className={cn(
									"w-4 h-4 text-muted-foreground transition-transform duration-200",
									isExpanded && "transform rotate-90"
								)}
							/>
						)}
					</a>
					{hasChildren && isExpanded && (
						<div className="mt-1 space-y-1 overflow-hidden">
							{renderSidebarItems(item.children!, level + 1)}
						</div>
					)}
				</div>
			);
		});
	};

	const renderContent = () => {
		const selectedSection = sections.find(s => s.key === selectedSectionKey);
		if (!selectedSection) return <div className="prose max-w-none"><h2>Selamat datang di Pusat Bantuan</h2><p>Silakan pilih topik dari sidebar untuk memulai.</p></div>;

		// If there's an active child, we need to render the parent's content
		// but pass in the child's key to identify the sub-content.
		if (activeChildKey && selectedSection.content) {
			// Find the actual child item to get its 'childContent' property
			const findChild = (items: SectionItem[]): SectionItem | undefined => {
				for (const item of items) {
					if (item.key === activeChildKey) return item;
					if (item.children) {
						const found = findChild(item.children);
						if (found) return found;
					}
				}
			};
			const activeChildItem = findChild(selectedSection.children || []);
			
			if (React.isValidElement<{ section?: string }>(selectedSection.content)) {
				return cloneElement(selectedSection.content, {
					section: activeChildItem?.childContent || activeChildKey,
				});
			}
		}

		// Otherwise, render the main section's content
		return selectedSection.content;
	};

	return (
		<div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)]">
			{/* Sidebar - Collapsible on mobile */}
			<aside className="w-full lg:w-1/4 lg:min-h-screen bg-card border-r shadow-sm p-4 space-y-4">
				<h2 className="text-2xl font-bold text-foreground">Pusat Bantuan</h2>
				<div className="relative">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Cari panduan..."
						value={searchValue}
						onChange={onSearchChange}
						className="w-full pl-9 bg-background/50"
					/>
				</div>
				
				<div className="h-px bg-border my-4"></div>
				
				<nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-12rem)]">
					{renderSidebarItems(displaySections)}
				</nav>
			</aside>

			{/* Main Content */}
			<main className="w-full lg:w-3/4 p-6 lg:p-8 overflow-y-auto bg-background animate-fadeIn">
				<div className="max-w-4xl mx-auto">
					{renderContent()}
				</div>
			</main>
		</div>
	);
};