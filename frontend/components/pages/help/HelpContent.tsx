import React, { cloneElement } from "react";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";

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
				<div key={item.key}>
					<a
						href="#"
						onClick={e => {
							e.preventDefault();
							onSectionSelect(item.key);
						}}
						className={`flex items-center justify-between w-full px-4 py-2 text-left rounded-md transition-colors duration-150 ${
							isActiveChild
								? "bg-blue-100 text-blue-600 font-semibold"
								: isSelected && !activeChildKey && level === 0
								? "bg-gray-200 text-gray-800 font-semibold"
								: "text-gray-600 hover:bg-gray-100"
						}`}
						style={{ paddingLeft: `${1 + level * 1.5}rem` }}
					>
						<span>{item.label}</span>
						{hasChildren && (
							<ChevronRight
								className={`w-5 h-5 transition-transform duration-200 ${
									isExpanded ? "rotate-90" : ""
								}`}
							/>
						)}
					</a>
					{hasChildren && isExpanded && (
						<div className="mt-1">
							{renderSidebarItems(item.children!, level + 1)}
						</div>
					)}
				</div>
			);
		});
	};

	const renderContent = () => {
		const selectedSection = sections.find(s => s.key === selectedSectionKey);
		if (!selectedSection) return <div className="prose max-w-none"><h2>Welcome to the Help Center</h2><p>Please select a topic from the sidebar to get started.</p></div>;

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
		<div className="flex h-full">
			{/* Sidebar */}
			<aside className="w-1/4 min-h-screen bg-white border-r p-4 space-y-4">
				<h2 className="text-xl font-bold text-gray-800">Help Center</h2>
				<Input
					type="search"
					placeholder="Search..."
					value={searchValue}
					onChange={onSearchChange}
					className="w-full"
				/>
				<nav className="space-y-1">
					{renderSidebarItems(displaySections)}
				</nav>
			</aside>

			{/* Main Content */}
			<main className="w-3/4 p-8 overflow-y-auto">
				{renderContent()}
			</main>
		</div>
	);
};