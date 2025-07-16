"use client";

import { useState, useEffect, cloneElement } from "react";
import {
	GettingStarted,
	FAQ,
	Feedback,
	HelpContent,
	StatisticsGuide,
	FileGuide,
	type SectionItem,
} from "@/app/help/components";
import {
	AggregateGuide,
	DefineDateTimeGuide,
	DefineVarPropsGuide,
	DuplicateCasesGuide,
	RestructureGuide,
	SelectCasesGuide,
	SetMeasurementLevelGuide,
	SortCasesGuide,
	SortVarsGuide,
	TransposeGuide,
	UnusualCasesGuide,
	WeightCasesGuide,
} from "@/app/help/components/data-guide";

const DataGuide = ({ section }: { section?: string }) => {
	switch (section) {
		case "aggregate":
			return <AggregateGuide />;
		case "define-datetime":
			return <DefineDateTimeGuide />;
		case "define-var-props":
			return <DefineVarPropsGuide />;
		case "duplicate-cases":
			return <DuplicateCasesGuide />;
		case "restructure":
			return <RestructureGuide />;
		case "select-cases":
			return <SelectCasesGuide />;
		case "set-measurement-level":
			return <SetMeasurementLevelGuide />;
		case "sort-cases":
			return <SortCasesGuide />;
		case "sort-vars":
			return <SortVarsGuide />;
		case "transpose":
			return <TransposeGuide />;
		case "unusual-cases":
			return <UnusualCasesGuide />;
		case "weight-cases":
			return <WeightCasesGuide />;
		default:
			return <AggregateGuide />; // Show a default guide
	}
};


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
			key: "file-guide",
			label: "File Management",
			content: <FileGuide section={activeChild || undefined} />,
			children: [
				{ key: 'import-sav', label: 'Import .sav', parentKey: 'file-guide', childContent: 'import-sav' },
				{ key: 'import-csv', label: 'Import CSV', parentKey: 'file-guide', childContent: 'import-csv' },
				{ key: 'import-excel', label: 'Import Excel', parentKey: 'file-guide', childContent: 'import-excel' },
				{ key: 'import-clipboard', label: 'Import from Clipboard', parentKey: 'file-guide', childContent: 'import-clipboard' },
				{ key: 'export-csv', label: 'Export CSV', parentKey: 'file-guide', childContent: 'export-csv' },
				{ key: 'export-excel', label: 'Export Excel', parentKey: 'file-guide', childContent: 'export-excel' },
				{ key: 'example-data', label: 'Example Data', parentKey: 'file-guide', childContent: 'example-data' },
				{ key: 'print', label: 'Print', parentKey: 'file-guide', childContent: 'print' },
			]
		},
		{
			key: "data-guide",
			label: "Data Management",
			content: <DataGuide section={activeChild || undefined} />,
			children: [
				{ key: 'aggregate', label: 'Aggregate', parentKey: 'data-guide', childContent: 'aggregate' },
				{ key: 'define-datetime', label: 'Define Date and Time', parentKey: 'data-guide', childContent: 'define-datetime' },
				{ key: 'define-var-props', label: 'Define Variable Properties', parentKey: 'data-guide', childContent: 'define-var-props' },
				{ key: 'duplicate-cases', label: 'Identify Duplicate Cases', parentKey: 'data-guide', childContent: 'duplicate-cases' },
				{ key: 'restructure', label: 'Restructure', parentKey: 'data-guide', childContent: 'restructure' },
				{ key: 'select-cases', label: 'Select Cases', parentKey: 'data-guide', childContent: 'select-cases' },
				{ key: 'set-measurement-level', label: 'Set Measurement Level', parentKey: 'data-guide', childContent: 'set-measurement-level' },
				{ key: 'sort-cases', label: 'Sort Cases', parentKey: 'data-guide', childContent: 'sort-cases' },
				{ key: 'sort-vars', label: 'Sort Variables', parentKey: 'data-guide', childContent: 'sort-vars' },
				{ key: 'transpose', label: 'Transpose', parentKey: 'data-guide', childContent: 'transpose' },
				{ key: 'unusual-cases', label: 'Identify Unusual Cases', parentKey: 'data-guide', childContent: 'unusual-cases' },
				{ key: 'weight-cases', label: 'Weight Cases', parentKey: 'data-guide', childContent: 'weight-cases' },
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

	// This is a new block to correctly pass the active child content to the main component
	const selectedSection = sectionsData.find(s => s.key === selected);
	const contentToRender = selectedSection && selectedSection.content
		? cloneElement(selectedSection.content, { section: activeChild || undefined }) 
		: null;


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
			<div className="flex-1 overflow-y-auto p-6 md:p-8">
        {contentToRender}
      </div>
		</div>
	);
}