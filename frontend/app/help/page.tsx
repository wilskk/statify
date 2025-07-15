"use client";

import { useState, useEffect } from "react";
import {
	GettingStarted,
	FAQ,
	Feedback,
	HelpContent,
	StatisticsGuide,
	type SectionItem,
} from "@/app/help/components";

export default function HelpPage() {
	const [selected, setSelected] = useState("getting-started");
	const [search, setSearch] = useState("");
	const [activeChild, setActiveChild] = useState<string | null>(null);
	const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
		new Set(["statistics-guide"])
	);
	const [mounted, setMounted] = useState(false);

	// For mounting animation
	useEffect(() => {
		setMounted(true);
	}, []);

	const sectionsData: SectionItem[] = [
		{
			key: "getting-started",
			label: "Getting Started",
			content: <GettingStarted />
		},
		{
			key: 'statistics-guide',
			label: 'Statistics Guide',
			content: <StatisticsGuide />,
			children: [
				{
					key: 'descriptive-stats',
					label: 'Descriptive Statistics',
					parentKey: 'statistics-guide',
					children: [
						{ key: 'frequencies', label: 'Frequencies', parentKey: 'descriptive-stats', childContent: 'frequencies' },
						{ key: 'descriptives', label: 'Descriptives', parentKey: 'descriptive-stats', childContent: 'descriptives' },
						{ key: 'explore', label: 'Explore', parentKey: 'descriptive-stats', childContent: 'explore' },
						{ key: 'crosstabs', label: 'Crosstabs', parentKey: 'descriptive-stats', childContent: 'crosstabs' },
					]
				}
			]
		},
		{
			key: "faq",
			label: "FAQs",
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
			(s.children && s.children.some(child => 
				child.label.toLowerCase().includes(searchLower) || 
				(child.children && child.children.some(subchild => 
					subchild.label.toLowerCase().includes(searchLower)
				))
			))
	);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value);
		
		// If the current selected section isn't in the search results,
		// select the first result automatically
		if (e.target.value && filteredSectionsResult.length > 0 && 
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
			
			// Make sure all parent sections are expanded
			if (parentKey) {
				const newExpandedKeys = new Set(expandedKeys);
				while(parentKey) {
					newExpandedKeys.add(parentKey);
					const parent = findItem(sectionsData, parentKey);
					if (parent) {
						topLevelKey = parent.key;
						parentKey = parent.parentKey;
					} else {
						break;
					}
				}
				setExpandedKeys(newExpandedKeys);
			}
			
			setSelected(topLevelKey);
		}
	};

	const sectionsToDisplayInSidebar = search ? filteredSectionsResult : sectionsData;

	return (
		<div className={`bg-background h-screen overflow-hidden transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
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