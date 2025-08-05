import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpGuideTemplate } from "../ui/HelpGuideTemplate";
import { HelpCard, HelpAlert, HelpSection } from "../ui/HelpLayout";
import { HelpCircle, Search, FileQuestion, FileCode, BarChart4, Clock, Save, MessageCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

// Statify-specific FAQ data
const faqs = [
  {
    question: "What is a .sav file?",
    answer: "A .sav file is the data format used by SPSS (Statistical Package for the Social Sciences). Statify can read and write this format, enabling seamless interoperability with SPSS."
  },
  {
    question: "How do I import data from Excel?",
    answer: "To import data from Excel, click the 'File' menu and select 'Import Excel'. You can customize import settings such as which sheet to read, header rows, and variable data types."
  },
  {
    question: "How do I perform descriptive analysis?",
    answer: "To perform descriptive analysis, select the variables you want to analyze from the variables panel, then click the 'Analyze' menu and choose 'Descriptive Statistics'. You can select which statistics to display such as mean, median, mode, and standard deviation."
  },
  {
    question: "Can Statify create graphs?",
    answer: "Yes, Statify includes various chart types such as bar charts, histograms, scatter plots, and box plots. You can create charts by selecting the 'Graphs' menu and then choosing your desired chart type."
  },
  {
    question: "How do I perform hypothesis testing?",
    answer: "To perform hypothesis testing, select the 'Analyze' menu, then choose the appropriate test type such as T-Test, ANOVA, or Chi-Square. Select relevant variables and adjust test parameters as needed."
  },
  {
    question: "Does Statify save data automatically?",
    answer: "Yes, Statify has an autosave feature that will save your work automatically if the application detects you've been inactive for some time. However, we still recommend saving your work regularly by clicking 'File' > 'Save'."
  },
  {
    question: "How do I export analysis results?",
    answer: "Analysis results can be exported in PDF, Excel, or image formats. Right-click on the analysis output and select the 'Export' option, then choose your desired format."
  },
  {
    question: "How do I handle missing data in analysis?",
    answer: "In Statify's statistical analysis, you can choose how to handle missing values for each type of analysis. In the analysis dialog box, you can select options like 'Exclude cases pairwise', 'Exclude cases listwise', or use specific estimation methods according to your analysis needs."
  }
];

// FAQ categories
const faqCategories = [
  {
    name: "Data & Files",
    icon: <FileCode className="h-5 w-5 mr-2 text-primary/70" />,
    faqs: [faqs[0], faqs[1], faqs[5], faqs[6]]
  },
  {
    name: "Statistical Analysis",
    icon: <BarChart4 className="h-5 w-5 mr-2 text-primary/70" />,
    faqs: [faqs[2], faqs[3], faqs[4], faqs[7]]
  }
];

export const FAQ = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Quick Help',
      description: 'Important information to get you started',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Can't find what you're looking for?">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-3">
              <p className="text-sm flex-1">
                Use the search feature or contact our support team for further assistance.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search Help
                </Button>
                <Button variant="default" size="sm">
                  <FileQuestion className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </div>
          </HelpAlert>
          
          <HelpCard title="Autosave Feature" icon={Clock} variant="feature">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Statify automatically saves your work when the application detects periods of inactivity. 
                This helps prevent data loss if the application is accidentally closed.
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Save className="h-3.5 w-3.5" />
                <span>Work automatically saved</span>
              </div>
            </div>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'data-file',
      title: 'Data & Files',
      description: 'Frequently asked questions about data and file management',
      icon: FileCode,
      content: (
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {faqCategories[0].faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`data-file-${index}`}
                className="border-b border-border/50"
              >
                <AccordionTrigger className="text-left font-medium hover:text-primary py-3 text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground py-2 pb-4 text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )
    },
    {
      id: 'statistics',
      title: 'Statistical Analysis',
      description: 'Frequently asked questions about statistical analysis',
      icon: BarChart4,
      content: (
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full">
            {faqCategories[1].faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`statistics-${index}`}
                className="border-b border-border/50"
              >
                <AccordionTrigger className="text-left font-medium hover:text-primary py-3 text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground py-2 pb-4 text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )
    }
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Feedback',
      content: 'Help us improve documentation by providing feedback on each help page.'
    },
    {
      type: 'info' as const,
      title: 'Search',
      content: 'Use the search feature to quickly find answers using keywords.'
    }
  ];

  const relatedTopics = [
    { title: 'Getting Started', href: '/help/getting-started' },
    { title: 'Import SPSS Files', href: '/help/file-guide/import-sav' },
    { title: 'Descriptive Statistics', href: '/help/statistics-guide/descriptive' },
    { title: 'Data Management', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Frequently Asked Questions"
      description="Find answers to common questions about using Statify"
      category="FAQ"
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};