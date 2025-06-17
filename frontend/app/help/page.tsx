"use client";

import { useState } from "react";
import HelpContent, { SectionItem } from "@/components/pages/help/HelpContent";
import {
	GettingStarted,
	FeaturesOverview,
	DataManagement,
	AnalysisTools,
	FAQ,
	ContactSupport,
	Feedback
} from "@/components/pages/help";

const sectionsData: SectionItem[] = [
	{
		key: "getting-started",
		label: "Getting Started",
		content: <GettingStarted />
	},
	{
		key: "features",
		label: "Features Overview",
		content: <FeaturesOverview />
	},
	{
		key: "data-management",
		label: "Data Management",
		content: <DataManagement />
	},
	{
		key: "analysis-tools",
		label: "Analysis Tools",
		content: <AnalysisTools />
	},
	{
		key: "faq",
		label: "Frequently Asked Questions",
		content: <FAQ />
	},
	{
		key: "support",
		label: "Contact & Support",
		content: <ContactSupport />
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

	const searchLower = typeof search === 'string' && typeof search.toLowerCase === 'function' 
		? search.toLowerCase() 
		: "";

	const filteredSectionsResult = sectionsData.filter(
		(s) =>
			s.label.toLowerCase().includes(searchLower)
	);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value);
		
		// If the current selected section isn't in the search results,
		// select the first result automatically
		if (search && filteredSectionsResult.length > 0 && 
			!filteredSectionsResult.some(s => s.key === selected)) {
			setSelected(filteredSectionsResult[0].key);
		}
	};

	const sectionsToDisplayInSidebar = search ? filteredSectionsResult : sectionsData;

	return (
		<div className="bg-gray-50 min-h-screen">
			<HelpContent
				sections={sectionsData}
				selectedSectionKey={selected}
				onSectionSelect={setSelected}
				searchValue={search}
				onSearchChange={handleSearchChange}
				displaySections={sectionsToDisplayInSidebar}
			/>
		</div>
	);
}