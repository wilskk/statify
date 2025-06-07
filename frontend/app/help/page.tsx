"use client";

import { useState } from "react";
import HelpContent, { SectionItem } from "@/components/pages/help/HelpContent";
import {
	GettingStarted,
	StatisticsGuide,
	FAQ,
	Feedback
} from "@/components/pages/help";

const sectionsData: SectionItem[] = [
	{
		key: "getting-started",
		label: "Getting Started",
		content: <GettingStarted />
	},
	{
		key: "statistics-guide",
		label: "Statistics Guide",
		content: <StatisticsGuide />,
		children: [
			{
				key: "frequencies",
				label: "Frequencies",
				parentKey: "statistics-guide",
				childContent: "frequencies"
			},
			{
				key: "descriptives",
				label: "Descriptive Statistics",
				parentKey: "statistics-guide",
				childContent: "descriptives"
			}
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

export default function HelpPage() {
	const [selected, setSelected] = useState("getting-started");
	const [search, setSearch] = useState("");
	const [activeChild, setActiveChild] = useState<string | null>(null);

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
		const section = sectionsData.find(s => s.key === key);
		if (section) {
			setSelected(key);
			// If selecting a parent section, clear the active child
			if (!key.includes('.')) {
				setActiveChild(null);
			}
		}

		// Check if it's a child section
		for (const parentSection of sectionsData) {
			if (parentSection.children) {
				const childSection = parentSection.children.find(c => c.key === key);
				if (childSection) {
					setSelected(parentSection.key);
					setActiveChild(key);
					break;
				}
			}
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
			/>
		</div>
	);
}