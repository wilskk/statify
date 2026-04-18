import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OptionsTabProps {
  config: any;
  setConfig: (config: any) => void;
}

export const OptionsTab: React.FC<OptionsTabProps> = ({ config, setConfig }) => {
  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleNestedConfigChange = (category: string, key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }));
  };

  return (
    <div className="flex flex-col h-full z-0">
      <ScrollArea className="h-full pr-4">
        <div className="space-y-8 pb-8 pt-4">
          
          {/* Text Preprocessing */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Text Preprocessing</h3>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="lowercase" 
                checked={config.lowercase}
                onCheckedChange={(checked) => handleConfigChange("lowercase", checked === true)}
              />
              <Label htmlFor="lowercase" className="text-sm font-normal cursor-pointer">
                Lowercase
              </Label>
            </div>
          </div>

          {/* Stopwords Removal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Stopwords Removal</h3>
            <RadioGroup 
              value={config.stopwords.method} 
              onValueChange={(val) => handleNestedConfigChange("stopwords", "method", val)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="sw-none" />
                <Label htmlFor="sw-none" className="font-normal cursor-pointer">None</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="indonesian" id="sw-id" />
                <Label htmlFor="sw-id" className="font-normal cursor-pointer">Indonesian</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="english" id="sw-en" />
                <Label htmlFor="sw-en" className="font-normal cursor-pointer">English</Label>
              </div>
              <div className="flex items-start space-x-2 mt-2">
                <RadioGroupItem value="custom" id="sw-custom" className="mt-1" />
                <div className="flex flex-col w-full max-w-sm space-y-2">
                  <Label htmlFor="sw-custom" className="font-normal cursor-pointer">Custom</Label>
                  <Textarea 
                    disabled={config.stopwords.method !== "custom"}
                    value={config.stopwords.customList}
                    onChange={(e) => handleNestedConfigChange("stopwords", "customList", e.target.value)}
                    placeholder="Enter stopwords, one per line..."
                    className="h-32 text-sm disabled:opacity-50"
                  />
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Stemming */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Stemming</h3>
            <RadioGroup 
              value={config.stemming.method} 
              onValueChange={(val) => handleNestedConfigChange("stemming", "method", val)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="stem-none" />
                <Label htmlFor="stem-none" className="font-normal cursor-pointer">None</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="indonesian" id="stem-id" />
                <Label htmlFor="stem-id" className="font-normal cursor-pointer">Indonesian (Sastrawi)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="english" id="stem-en" />
                <Label htmlFor="stem-en" className="font-normal cursor-pointer">English (Porter)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Tokenizer & Delimiters */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Tokenizer</h3>
              <RadioGroup 
                value={config.tokenizer.type} 
                onValueChange={(val) => handleNestedConfigChange("tokenizer", "type", val)}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="word" id="tok-word" />
                  <Label htmlFor="tok-word" className="font-normal cursor-pointer">Word</Label>
                </div>
                <div className="flex items-center space-x-2 h-8">
                  <RadioGroupItem value="ngram" id="tok-ngram" />
                  <Label htmlFor="tok-ngram" className="font-normal cursor-pointer pr-2">N-gram</Label>
                  {/* Inline min/max size */}
                  <div className={`flex items-center space-x-2 transition-opacity ${config.tokenizer.type === "ngram" ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                    <Label htmlFor="ngram-max" className="text-xs text-muted-foreground">max size</Label>
                    <Input 
                      id="ngram-max" 
                      type="number" 
                      min={1} 
                      max={10} 
                      className="w-16 h-7 text-xs px-2" 
                      value={config.tokenizer.maxSize} 
                      onChange={(e) => handleNestedConfigChange("tokenizer", "maxSize", parseInt(e.target.value) || 1)}
                    />
                    <Label htmlFor="ngram-min" className="text-xs text-muted-foreground ml-2">min size</Label>
                    <Input 
                      id="ngram-min" 
                      type="number" 
                      min={1} 
                      max={10} 
                      className="w-16 h-7 text-xs px-2" 
                      value={config.tokenizer.minSize}
                      onChange={(e) => handleNestedConfigChange("tokenizer", "minSize", parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2 max-w-xs pt-1">
              <Label htmlFor="delimiters" className="text-sm font-semibold">Delimiters</Label>
              <Input 
                id="delimiters" 
                value={config.delimiters} 
                onChange={(e) => handleConfigChange("delimiters", e.target.value)}
                className="h-9 text-sm font-mono"
              />
            </div>
          </div>

          {/* Vectorization Method */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Vectorization Method</h3>
            <RadioGroup 
              value={config.vectorizationMethod} 
              onValueChange={(val) => handleConfigChange("vectorizationMethod", val)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="binary" id="vec-binary" />
                <Label htmlFor="vec-binary" className="font-normal cursor-pointer">Binary (0/1)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wordCount" id="vec-wordCount" />
                <Label htmlFor="vec-wordCount" className="font-normal cursor-pointer">Word Count</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tf" id="vec-tf" />
                <Label htmlFor="vec-tf" className="font-normal cursor-pointer">TF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="idf" id="vec-idf" />
                <Label htmlFor="vec-idf" className="font-normal cursor-pointer">IDF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="tfidf" id="vec-tfidf" />
                <Label htmlFor="vec-tfidf" className="font-normal cursor-pointer">TF-IDF</Label>
              </div>
            </RadioGroup>
          </div>
          
        </div>
      </ScrollArea>
    </div>
  );
};
