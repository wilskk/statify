import React, { cloneElement } from "react";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, HelpCircle, MessageSquare, ChevronRight, Book, Home, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Accordion,
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

// Helper to get icon based on section key
const getSectionIcon = (key: string) => {
  switch(key) {
    case 'getting-started':
      return <BookOpen className="w-4 h-4 mr-2" />;
    case 'statistics-guide':
      return <Book className="w-4 h-4 mr-2" />;
    case 'faq':
      return <HelpCircle className="w-4 h-4 mr-2" />;
    case 'feedback':
      return <MessageSquare className="w-4 h-4 mr-2" />;
    default:
      return null;
  }
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

			if (hasChildren && level === 0) {
				// Top-level items with children use accordion
				return (
					<AccordionItem key={item.key} value={item.key} className="border-0">
						<AccordionTrigger 
							className={cn(
								"py-2 px-3 rounded-lg hover:bg-accent/50 transition-colors",
								isSelected && !activeChildKey && "bg-accent text-accent-foreground font-medium"
							)}
							onClick={(e) => {
								e.stopPropagation();
								onSectionSelect(item.key);
							}}
						>
							<div className="flex items-center">
								{getSectionIcon(item.key)}
								<span>{item.label}</span>
							</div>
						</AccordionTrigger>
						<AccordionContent className="pb-0">
							<div className="ml-5 pl-2 border-l border-border space-y-1">
								{renderSidebarItems(item.children!, level + 1)}
							</div>
						</AccordionContent>
					</AccordionItem>
				);
			} else if (hasChildren) {
				// Nested items with children
				return (
					<div key={item.key} className="mt-1">
						<button
							onClick={() => onSectionSelect(item.key)}
							className={cn(
								"flex items-center justify-between w-full px-3 py-2 text-left rounded-md transition-colors text-sm",
								isExpanded ? "font-medium text-primary" : "text-muted-foreground",
								"hover:bg-accent/40"
							)}
						>
							<span>{item.label}</span>
							<ChevronRight
								className={cn(
									"w-4 h-4 transition-transform duration-150",
									isExpanded && "transform rotate-90"
								)}
							/>
						</button>
						
						{isExpanded && (
							<div className="ml-4 pl-2 border-l border-border/50 space-y-1 py-1">
								{renderSidebarItems(item.children!, level + 1)}
							</div>
						)}
					</div>
				);
			} else {
				// Leaf items (no children)
				return (
					<div key={item.key} className="animate-fadeIn" style={{ animationDelay: `${level * 30}ms` }}>
						<button
							onClick={() => onSectionSelect(item.key)}
							className={cn(
								"flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors",
								isActiveChild
									? "bg-primary/10 text-primary font-medium"
									: isSelected && !activeChildKey && level === 0
									? "bg-accent text-accent-foreground font-medium"
									: "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
							)}
						>
							{level === 0 && getSectionIcon(item.key)}
							<span>{item.label}</span>
							{searchValue && item.label.toLowerCase().includes(searchValue.toLowerCase()) && (
								<Badge variant="outline" className="ml-auto text-xs bg-primary/10">Match</Badge>
							)}
						</button>
					</div>
				);
			}
		});
	};

	const renderBreadcrumbs = () => {
		const selectedSection = sections.find(s => s.key === selectedSectionKey);
		if (!selectedSection) return null;

		const breadcrumbs = [{ key: "home", label: "Help Center" }, { key: selectedSection.key, label: selectedSection.label }];
		
		// Add active child if exists
		if (activeChildKey) {
			const findChildPath = (items: SectionItem[], key: string, path: SectionItem[] = []): SectionItem[] | null => {
				for (const item of items) {
					if (item.key === key) return [...path, item];
					if (item.children) {
						const foundPath = findChildPath(item.children, key, [...path, item]);
						if (foundPath) return foundPath;
					}
				}
				return null;
			};
			
			const childPath = findChildPath(sections, activeChildKey);
			if (childPath) {
				// Start from index 1 to skip the top-level parent that's already added
				for (let i = 1; i < childPath.length; i++) {
					breadcrumbs.push({ key: childPath[i].key, label: childPath[i].label });
				}
			}
		}

		return (
			<Breadcrumb className="mb-4">
				<BreadcrumbList>
					{breadcrumbs.map((crumb, i) => (
						<React.Fragment key={crumb.key}>
							{i > 0 && <BreadcrumbSeparator />}
							<BreadcrumbItem>
								{i === breadcrumbs.length - 1 ? (
									<span className="font-medium text-foreground">{crumb.label}</span>
								) : (
									<BreadcrumbLink 
										onClick={() => onSectionSelect(crumb.key)}
										className="cursor-pointer hover:text-primary"
									>
										{i === 0 && <Home className="h-3 w-3 inline mr-1" />}
										{crumb.label}
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
						</React.Fragment>
					))}
				</BreadcrumbList>
			</Breadcrumb>
		);
	};

	const renderContent = () => {
		const selectedSection = sections.find(s => s.key === selectedSectionKey);
		if (!selectedSection) return (
			<div className="text-center py-10">
				<Book className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
				<h2 className="text-2xl font-bold mb-2">Welcome to the Help Center</h2>
				<p className="text-muted-foreground max-w-md mx-auto mb-6">
					Please select a topic from the sidebar to get started or use the search to find specific information.
				</p>
				<Button 
					variant="outline" 
					className="mx-auto"
					onClick={() => onSectionSelect("getting-started")}
				>
					<BookOpen className="h-4 w-4 mr-2" />
					Browse Getting Started Guide
				</Button>
			</div>
		);

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

	// For responsive mobile view
	const [sidebarOpen, setSidebarOpen] = React.useState(false);

	return (
		<div className="flex flex-col lg:flex-row h-full overflow-hidden">
			{/* Mobile sidebar toggle */}
			<div className="lg:hidden fixed bottom-4 right-4 z-30">
				<Button 
					size="sm" 
					onClick={() => setSidebarOpen(!sidebarOpen)} 
					className="rounded-full w-12 h-12 shadow-lg flex items-center justify-center"
				>
					{sidebarOpen ? 
						<ArrowLeft className="h-5 w-5" /> : 
						<Book className="h-5 w-5" />
					}
				</Button>
			</div>
			
			{/* Sidebar - Collapsible on mobile */}
			<aside 
				className={cn(
					"lg:w-72 lg:min-h-screen bg-card border-r border-border shadow-sm overflow-y-auto z-20 transition-all duration-300",
					sidebarOpen 
						? "fixed inset-y-0 left-0 w-80 transform translate-x-0" 
						: "fixed inset-y-0 left-0 w-80 transform -translate-x-full lg:transform-none lg:static"
				)}
			>
				<div className="sticky top-0 bg-card z-10 p-4 pb-2 border-b border-border/50">
					<h2 className="text-xl font-bold text-foreground flex items-center mb-3">
						<Book className="w-5 h-5 mr-2" />
						Help Center
					</h2>
					<div className="relative">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search guides..."
							value={searchValue}
							onChange={onSearchChange}
							className="w-full pl-9 bg-background focus:ring-1 ring-primary/30"
						/>
					</div>
				</div>
				
				<nav className="p-3">
					{displaySections.length > 0 ? (
						<Accordion 
							type="multiple" 
							defaultValue={Array.from(expandedKeys)}
							className="space-y-1"
						>
							{renderSidebarItems(displaySections)}
						</Accordion>
					) : (
						<div className="text-sm text-muted-foreground p-2">No results found</div>
					)}
				</nav>
			</aside>

			{/* Backdrop for mobile sidebar */}
			{sidebarOpen && (
				<div 
					className="fixed inset-0 bg-background/80 backdrop-blur-sm z-10 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Main Content */}
			<main className="flex-1 p-4 lg:p-0 overflow-y-auto bg-background animate-fadeIn">
				{/* Top navigation bar */}
				<div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 py-3 px-6">
					{renderBreadcrumbs()}
				</div>

				<div className="max-w-4xl mx-auto px-4 py-6 lg:px-8">
					<Card className="border shadow-sm">
						<CardContent className="p-6 lg:p-8">
							{renderContent()}
						</CardContent>
					</Card>

					{/* Quick navigation section */}
					<div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-border pt-4">
						<div className="text-sm text-muted-foreground">
							Was this helpful?
						</div>
						<div className="flex space-x-2 mt-2 sm:mt-0">
							<Button variant="outline" size="sm" className="text-xs">
								Previous
							</Button>
							<Button variant="outline" size="sm" className="text-xs">
								Next
							</Button>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};