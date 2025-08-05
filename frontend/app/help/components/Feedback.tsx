import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpGuideTemplate } from "../ui/HelpGuideTemplate";
import { HelpCard, HelpAlert, HelpSection } from "../ui/HelpLayout";
import { SendHorizontal, Star, ThumbsUp, MessageSquare, Mail, Users, BookOpen } from "lucide-react";

export const Feedback = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Feedback Types',
      description: 'Choose the type of feedback that suits your needs',
      icon: BookOpen,
      content: (
        <div className="grid gap-4 md:grid-cols-3">
          <HelpCard title="Feature Requests" icon={ThumbsUp} variant="feature">
            <p className="text-sm text-muted-foreground">
              Suggestions for new features or improvements that can enhance your workflow.
            </p>
          </HelpCard>
          
          <HelpCard title="Bug Reports" icon={MessageSquare} variant="feature">
            <p className="text-sm text-muted-foreground">
              Report issues or unexpected behavior in the application.
            </p>
          </HelpCard>
          
          <HelpCard title="General Feedback" icon={Star} variant="feature">
            <p className="text-sm text-muted-foreground">
              Share your overall experience and opinions about Statify.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'feedback-form',
      title: 'Send Your Feedback',
      description: 'We continuously improve Statify based on user input',
      icon: Mail,
      content: (
        <div className="space-y-6">
          <HelpAlert variant="info" title="Your Feedback Matters">
            <p className="text-sm mt-2">
              Every feedback you provide helps us make Statify better. 
              Our team will carefully review each submission.
            </p>
          </HelpAlert>
          
          <HelpCard title="Feedback Form" variant="step">
            <form className="space-y-4 max-w-full">
              <div className="grid gap-4 md:grid-cols-2 w-full">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="feedbackType" className="text-sm">Feedback Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feedback type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="general">General Feedback</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="subject" className="text-sm">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief summary of your feedback"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="message" className="text-sm">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or suggestion in detail..."
                  className="min-h-[120px] resize-y w-full"
                  required
                />
              </div>
              
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox id="contactConsent" className="mt-1" />
                <Label htmlFor="contactConsent" className="text-sm text-muted-foreground">
                  I agree to be contacted regarding this feedback if needed
                </Label>
              </div>
              
              <div className="pt-2">
                <Button type="submit" className="w-full sm:w-auto">
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Send Feedback
                </Button>
              </div>
            </form>
          </HelpCard>
        </div>
      )
    }
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Effective Feedback',
      content: 'Provide specific details and steps to reproduce issues when reporting bugs.'
    },
    {
      type: 'info' as const,
      title: 'Response Time',
      content: 'Our team typically responds to feedback within 1-2 business days.'
    }
  ];

  const relatedTopics = [
    { title: 'Getting Started', href: '/help/getting-started' },
    { title: 'FAQ', href: '/help/faq' },
    { title: 'Contact Support', href: '/help/contact' },
    { title: 'User Guide', href: '/help/user-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Feedback & Support"
      description="Help us improve Statify by sharing your thoughts, suggestions, or reporting issues"
      category="Support"
      lastUpdated="2024-01-15"
      sections={sections}

      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};