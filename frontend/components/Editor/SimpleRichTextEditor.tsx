"use client";

import React, { useRef, useState, useEffect, useId } from 'react';
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import dynamic from 'next/dynamic';

// Import Quill styles
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  onSave?: () => void;
  id?: string;
}

// Client-side only component for Editor
const Editor = dynamic(() => import('./Editor'), {
  ssr: false,
  loading: () => <div className="min-h-[100px] border rounded-md bg-muted/20 animate-pulse"></div>
});

const SimpleRichTextEditor = ({
  value,
  onChange,
  placeholder = 'Tulis deskripsi...',
  editable = true,
  onSave,
  id: propId
}: SimpleRichTextEditorProps) => {
  // Generate a unique ID for this editor instance if one is not provided
  const uniqueId = useId();
  const editorId = propId || uniqueId;
  const quillRef = useRef<any>(null);
  const [lastChange, setLastChange] = useState<any>(null);
  
  // Handle changes from the editor
  const handleTextChange = (delta: any, oldContents: any, source: string) => {
    if (quillRef.current && source === 'user') {
      const html = quillRef.current.root.innerHTML;
      onChange(html);
      setLastChange(delta);
    }
  };
  
  // Effect to update editor content when value prop changes
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.clipboard.dangerouslyPasteHTML(value);
    }
  }, [value]);
  
  return (
    <div className="w-full border rounded-md overflow-hidden bg-background">
      {editable && onSave && (
        <div className="flex justify-end border-b bg-muted/50 px-2 py-1">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs h-7 px-2" 
            onClick={onSave}
            type="button"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Simpan
          </Button>
        </div>
      )}
      
      <div id={`editor-wrapper-${editorId}`} className="relative">
        <Editor 
          ref={quillRef}
          readOnly={!editable}
          defaultValue={value}
          onTextChange={handleTextChange}
        />
      </div>
    </div>
  );
};

export default SimpleRichTextEditor; 