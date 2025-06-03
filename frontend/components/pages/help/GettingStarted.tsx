import React from "react";

export const GettingStarted = () => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Getting Started with Statify</h3>
      <p>Follow these steps to begin using Statify's powerful analytics tools:</p>
      <ul className="list-disc ml-6 space-y-2">
        <li>Sign up for a Statify account.</li>
        <li>Connect your data sources using our integration wizards.</li>
        <li>Explore your personalized dashboard for insights.</li>
        <li>Configure alerts and notifications for key metrics.</li>
        <li>Customize your views to focus on important data.</li>
      </ul>
      <div className="mt-4 p-4 bg-sky-50 rounded-md border border-sky-100">
        <h4 className="font-medium text-sky-800">Pro Tip</h4>
        <p className="text-sky-700">Try our sample datasets to explore Statify's features before connecting your own data.</p>
      </div>
    </div>
  );
};

export default GettingStarted; 