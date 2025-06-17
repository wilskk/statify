"use client";

import { useState } from "react";
import { 
	GettingStarted,
	StatisticsGuide,
	FAQ,
	Feedback,
	HelpContent
} from "@/components/pages/help";
import type { SectionItem } from "@/components/pages/help";

export default function HelpPage() {
	const [selected, setSelected] = useState("getting-started");
	const [search, setSearch] = useState("");
	const [activeChild, setActiveChild] = useState<string | null>(null);
	const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
		new Set(["statistics-guide"])
	);

	const sectionsData: SectionItem[] = [
		{
			key: "getting-started",
			label: "Getting Started",
			content: <GettingStarted />
		},
		{
			key: "statistics-guide",
			label: "Statistics Guide",
			content: <StatisticsGuide section={activeChild || undefined} />,
			children: [
				{
					key: "descriptive",
					label: "Descriptive",
					parentKey: "statistics-guide",
					children: [
						{ key: "frequencies", label: "Frequencies", parentKey: "descriptive", childContent: "frequencies" },
						{ key: "descriptive-analysis", label: "Descriptive", parentKey: "descriptive", childContent: "descriptive-analysis" },
						{ key: "explore", label: "Explore", parentKey: "descriptive", childContent: "explore" },
						{ key: "crosstabs", label: "Crosstabs", parentKey: "descriptive", childContent: "crosstabs" },
					]
				},
				{ key: "time-series", label: "Time Series", parentKey: "statistics-guide", childContent: "time-series" },
				{ key: "non-parametric", label: "Non-Parametric Test", parentKey: "statistics-guide", childContent: "non-parametric" },
				{ key: "parametric", label: "Parametric Test", parentKey: "statistics-guide", childContent: "parametric" },
				{ key: "linear-model", label: "Linear Model", parentKey: "statistics-guide", childContent: "linear-model" },
				{ key: "classification", label: "Classification", parentKey: "statistics-guide", childContent: "classification" },
				{ key: "regression", label: "Regression", parentKey: "statistics-guide", childContent: "regression" },
			]
		},
		{
			key: "faq",
			label: "Frequently Asked Questions",
			content: <FAQ />
		},
		{
			key: "feedback",
			label: "Send Feedback",
			content: <Feedback />
		},
	];

	const searchLower = typeof search === 'string' && typeof search.toLowerCase === 'function' 
		? search.toLowerCase() 
		: "";

	const filteredSectionsResult = sectionsData.filter(
		(s) =>
			s.label.toLowerCase().includes(searchLower) ||
			(s.children && s.children.some(child => child.label.toLowerCase().includes(searchLower)))
	);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value);
		
		// If the current selected section isn't in the search results,
		// select the first result automatically
		if (search && filteredSectionsResult.length > 0 && 
			!filteredSectionsResult.some(s => s.key === selected)) {
			setSelected(filteredSectionsResult[0].key);
			setActiveChild(null);
		}
	};

	const handleSectionSelect = (key: string) => {
		const findItem = (items: SectionItem[], k: string): SectionItem | undefined => {
			for (const item of items) {
				if (item.key === k) return item;
				if (item.children) {
					const found = findItem(item.children, k);
					if (found) return found;
				}
			}
		};

		const item = findItem(sectionsData, key);
		if (!item) return;

		if (item.children && item.children.length > 0) {
			// It's a parent item, toggle its expansion
			setExpandedKeys(prev => {
				const newSet = new Set(prev);
				if (newSet.has(key)) {
					newSet.delete(key);
				} else {
					newSet.add(key);
				}
				return newSet;
			});
			// If it's a top-level item, also select it to show its main content
			if (!item.parentKey) {
				setSelected(item.key);
				setActiveChild(null);
			}
		} else {
			// It's a leaf item, set it as active
			setActiveChild(key);

			// Find the top-level parent and set it as selected
			let parentKey = item.parentKey;
			let topLevelKey = item.key; // Default to self if no parent
			
			while(parentKey) {
				const parent = findItem(sectionsData, parentKey);
				if (parent) {
					topLevelKey = parent.key;
					parentKey = parent.parentKey;
				} else {
					break; // Should not happen in well-formed data
				}
			}
			setSelected(topLevelKey);
		}
	};

	const sectionsToDisplayInSidebar = search ? filteredSectionsResult : sectionsData;

	return (
		<div className="bg-gray-50 min-h-screen">
			<HelpContent
				sections={sectionsData}
				selectedSectionKey={selected}
				activeChildKey={activeChild}
				onSectionSelect={handleSectionSelect}
				searchValue={search}
				onSearchChange={handleSearchChange}
				displaySections={sectionsToDisplayInSidebar}
				expandedKeys={expandedKeys}
			/>
		</div>
	);
}