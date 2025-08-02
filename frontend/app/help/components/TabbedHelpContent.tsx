"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, BookOpen, FileText, Database, BarChart3, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import all guide components
import GettingStarted from "./GettingStarted";
import FAQ from "./FAQ";
import Feedback from "./Feedback";
import FileGuide from "./FileGuide";
import StatisticsGuide from "./StatisticsGuide";

// Data guides
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
	WeightCasesGuide,
} from "./data-guide";

interface TabbedHelpContentProps {
	selectedGuide?: string;
	guideType?: string;
}

export const TabbedHelpContent: React.FC<TabbedHelpContentProps> = ({
	selectedGuide,
	guideType,
}) => {
	const [activeTab, setActiveTab] = useState("overview");

	// Determine which guides to show based on guideType
	const getGuideContent = () => {
		switch (guideType) {
			case "file-guide":
				return {
					title: "File Management Guide",
					description: "Learn how to import, export, and manage your data files",
					overview: (
						<Card>
							<CardHeader>
								<CardTitle>File Management Overview</CardTitle>
								<CardDescription>
									Master the art of data file management with our comprehensive guide
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h3 className="font-semibold mb-2">Supported Formats</h3>
									<p className="text-sm text-muted-foreground">
										Work with SPSS (.sav), CSV, Excel, and clipboard data seamlessly.
									</p>
								</div>
								<div>
									<h3 className="font-semibold mb-2">Quick Actions</h3>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Import data from various sources</li>
										<li>• Export results in multiple formats</li>
										<li>• Print data and analysis results</li>
										<li>• Use example datasets for practice</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					),
					guides: [
						{ key: "import-sav", label: "Import SPSS (.sav)", component: <FileGuide section="import-sav" /> },
						{ key: "import-csv", label: "Import CSV", component: <FileGuide section="import-csv" /> },
						{ key: "import-excel", label: "Import Excel", component: <FileGuide section="import-excel" /> },
						{ key: "import-clipboard", label: "Import Clipboard", component: <FileGuide section="import-clipboard" /> },
						{ key: "export-csv", label: "Export CSV", component: <FileGuide section="export-csv" /> },
						{ key: "export-excel", label: "Export Excel", component: <FileGuide section="export-excel" /> },
						{ key: "print", label: "Print Data", component: <FileGuide section="print" /> },
					]
				};
			case "data-guide":
				return {
					title: "Data Management Guide",
					description: "Transform and organize your data with powerful tools",
					overview: (
						<Card>
							<CardHeader>
								<CardTitle>Data Management Overview</CardTitle>
								<CardDescription>
									Discover techniques to clean, transform, and structure your data
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h3 className="font-semibold mb-2">Data Transformation</h3>
									<p className="text-sm text-muted-foreground">
										Restructure datasets, transpose variables, and aggregate data efficiently.
									</p>
								</div>
								<div>
									<h3 className="font-semibold mb-2">Data Quality</h3>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Identify and handle duplicate cases</li>
										<li>• Set proper variable measurement levels</li>
										<li>• Define date/time variables correctly</li>
										<li>• Sort and select cases strategically</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					),
					guides: [
						{ key: "aggregate", label: "Aggregate Data", component: <AggregateGuide /> },
						{ key: "restructure", label: "Restructure Data", component: <RestructureGuide /> },
						{ key: "transpose", label: "Transpose Data", component: <TransposeGuide /> },
						{ key: "select-cases", label: "Select Cases", component: <SelectCasesGuide /> },
						{ key: "sort-cases", label: "Sort Cases", component: <SortCasesGuide /> },
						{ key: "sort-vars", label: "Sort Variables", component: <SortVarsGuide /> },
						{ key: "set-measurement-level", label: "Set Measurement Level", component: <SetMeasurementLevelGuide /> },
						{ key: "define-datetime", label: "Define Date/Time", component: <DefineDateTimeGuide /> },
						{ key: "define-var-props", label: "Define Variable Properties", component: <DefineVarPropsGuide /> },
						{ key: "duplicate-cases", label: "Identify Duplicate Cases", component: <DuplicateCasesGuide /> },
						{ key: "weight-cases", label: "Weight Cases", component: <WeightCasesGuide /> },
					]
				};
			case "statistics-guide":
				return {
					title: "Statistics Guide",
					description: "Perform comprehensive statistical analysis on your data",
					overview: (
						<Card>
							<CardHeader>
								<CardTitle>Statistical Analysis Overview</CardTitle>
								<CardDescription>
									Explore powerful statistical tools to understand your data
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<h3 className="font-semibold mb-2">Descriptive Statistics</h3>
									<p className="text-sm text-muted-foreground">
										Generate frequencies, descriptives, and explore distributions.
									</p>
								</div>
								<div>
									<h3 className="font-semibold mb-2">Advanced Analysis</h3>
									<ul className="text-sm text-muted-foreground space-y-1">
										<li>• Cross-tabulation analysis</li>
										<li>• Robust statistical exploration</li>
										<li>• Outlier detection methods</li>
										<li>• Comprehensive result interpretation</li>
									</ul>
								</div>
							</CardContent>
						</Card>
					),
					guides: [
						{ key: "frequencies", label: "Frequencies Analysis", component: <StatisticsGuide section="frequencies" /> },
						{ key: "descriptives", label: "Descriptive Statistics", component: <StatisticsGuide section="descriptives" /> },
						{ key: "explore", label: "Explore Analysis", component: <StatisticsGuide section="explore" /> },
						{ key: "crosstabs", label: "Crosstabs Analysis", component: <StatisticsGuide section="crosstabs" /> },
					]
				};
			default:
				return {
					title: "Help Center",
					description: "Comprehensive guides for using Statify effectively",
					overview: <GettingStarted />,
					guides: []
				};
		}
	};

	const guideData = getGuideContent();
	const currentGuide = guideData.guides.find(g => g.key === selectedGuide);

	return (
		<div className="w-full">
			<div className="mb-6">
				<h1 className="text-2xl font-bold mb-2">{guideData.title}</h1>
				<p className="text-muted-foreground">{guideData.description}</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="overview" className="flex items-center gap-2">
						<BookOpen className="w-4 h-4" />
						Overview
					</TabsTrigger>
					<TabsTrigger value="guides" className="flex items-center gap-2">
						<HelpCircle className="w-4 h-4" />
						Detailed Guides
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-6">
					{guideData.overview}
				</TabsContent>

				<TabsContent value="guides" className="mt-6">
					{currentGuide ? (
						<div className="space-y-6">
							<div className="flex items-center justify-between">
								<h2 className="text-xl font-semibold">
									{currentGuide.label}
								</h2>
								<Badge variant="outline">{guideData.title}</Badge>
							</div>
							{currentGuide.component}
						</div>
					) : (
						<div className="grid gap-4">
							{guideData.guides.map((guide) => (
								<Card key={guide.key} className="hover:shadow-md transition-shadow">
									<CardHeader>
										<CardTitle className="text-lg">{guide.label}</CardTitle>
									</CardHeader>
									<CardContent>
										{guide.component}
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
};
