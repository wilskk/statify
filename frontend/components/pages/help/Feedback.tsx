import React from "react";
import { Input } from "@/components/ui/input";

export const Feedback = () => {
  return (
    <div>
      <p className="mb-4">We value your feedback and continuously strive to improve Statify based on your suggestions.</p>
      <form className="space-y-4 mt-2">
        <label className="block">
          <span className="text-sm font-medium">Your Email (optional)</span>
          <Input
            type="email"
            placeholder="you@example.com"
            className="mt-1"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Feedback Type</span>
          <select className="mt-1 w-full border rounded p-2">
            <option>Feature Request</option>
            <option>Bug Report</option>
            <option>General Feedback</option>
            <option>Other</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Message</span>
          <textarea
            className="mt-1 w-full border rounded p-2 min-h-[120px] resize-y"
            placeholder="Describe your issue or suggestion..."
            required
          />
        </label>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="contactConsent" className="rounded" />
          <label htmlFor="contactConsent" className="text-sm">I consent to being contacted about this feedback</label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
}; 