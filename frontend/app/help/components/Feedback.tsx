import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SendHorizontal, Star, ThumbsUp, MessageSquare } from "lucide-react";
import { HelpContentWrapper } from "./HelpContentWrapper";

export const Feedback = () => {
  return (
    <HelpContentWrapper 
      title="We Value Your Feedback"
      description="Help us improve Statify by sharing your thoughts, suggestions, or reporting issues."
    >
      <div className="grid gap-6 mt-6 md:grid-cols-3 mb-8">
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <ThumbsUp className="h-8 w-8 mx-auto text-primary/70 mb-2" />
            <h3 className="text-sm font-medium mb-1">Feature Requests</h3>
            <p className="text-xs text-muted-foreground">Suggest new features or improvements that would enhance your workflow.</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-primary/70 mb-2" />
            <h3 className="text-sm font-medium mb-1">Bug Reports</h3>
            <p className="text-xs text-muted-foreground">Let us know if you encounter any issues or unexpected behavior.</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto text-primary/70 mb-2" />
            <h3 className="text-sm font-medium mb-1">General Feedback</h3>
            <p className="text-xs text-muted-foreground">Share your thoughts on your overall experience with Statify.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="space-y-1 px-6 pt-5">
          <CardTitle className="text-xl font-bold">Send Your Feedback</CardTitle>
          <CardDescription className="text-sm">
            We continuously improve Statify based on user feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-3">
          <form className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                className="min-h-[120px] resize-y"
                required
              />
            </div>
            
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox id="contactConsent" className="mt-1" />
              <Label htmlFor="contactConsent" className="text-sm text-muted-foreground">
                I agree to be contacted regarding this feedback if necessary
              </Label>
            </div>
            
            <div className="pt-2">
              <Button type="submit" className="w-full sm:w-auto">
                <SendHorizontal className="mr-2 h-4 w-4" />
                Submit Feedback
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </HelpContentWrapper>
  );
}; 