"use client";

import React, { forwardRef, useEffect, useRef } from 'react';

// Proper import for Quill in Next.js
// Remove the global variable and conditional import
// We'll use dynamic import inside the useEffect hook instead

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  editorId?: string;
}

const QuillEditor = forwardRef<any, QuillEditorProps>(
  ({ value, onChange, placeholder, readOnly, editorId = 'quill-editor' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    
    // Set up the Quill instance
    useEffect(() => {
      if (containerRef.current && toolbarRef.current && !editorRef.current) {
        // Dynamic import of Quill inside useEffect to avoid SSR issues
        import('quill').then((QuillModule) => {
          const Quill = QuillModule.default;
          
          // Configure Quill with a custom toolbar container
          const quill = new Quill(containerRef.current!, {
            theme: 'snow',
            placeholder: placeholder,
            readOnly: readOnly,
            modules: {
              toolbar: toolbarRef.current,
              clipboard: {
                matchVisual: false
              }
            },
            formats: ['bold', 'italic', 'list']
          });

          // Set default indent and alignment
          quill.format('indent', 0);
          quill.format('align', 'left');
          
          // Set initial content if there's any
          if (value) {
            try {
              const content = value.startsWith('{') ? JSON.parse(value) : value;
              if (typeof content === 'string') {
                quill.clipboard.dangerouslyPasteHTML(content);
              } else if (content.ops) {
                quill.setContents(content);
              }
            } catch (err) {
              console.log('Error setting content:', err);
              quill.clipboard.dangerouslyPasteHTML(value);
            }
          }
          
          // Add text-change handler
          quill.on('text-change', () => {
            const html = quill.root.innerHTML;
            if (html === '<p><br></p>') {
              // Empty editor
              onChange('');
            } else {
              onChange(html);
            }
          });
          
          // Store the Quill instance
          editorRef.current = quill;
          
          // Expose the quill instance via ref
          if (ref) {
            if (typeof ref === 'function') {
              ref(quill);
            } else {
              ref.current = quill;
            }
          }
        }).catch(err => {
          console.error("Failed to load Quill:", err);
        });
      }
      
      return () => {
        // Clean up
        if (editorRef.current) {
          editorRef.current = null;
        }
        
        // Reset ref
        if (ref) {
          if (typeof ref === 'function') {
            ref(null);
          } else {
            ref.current = null;
          }
        }
      };
    }, [ref, value, placeholder, readOnly, editorId]);
    
    // Handle updates to editor content when value prop changes
    useEffect(() => {
      if (editorRef.current) {
        const editor = editorRef.current;
        // Only update content if it's different from current editor content
        const currentContent = editor.root.innerHTML;
        if (value !== currentContent) {
          // Get current selection
          const selection = editor.getSelection();
          
          // Set new content
          try {
            editor.clipboard.dangerouslyPasteHTML(value);
          } catch (err) {
            console.log('Error setting content:', err);
          }
          
          // Restore selection if needed
          if (selection) {
            setTimeout(() => editor.setSelection(selection), 0);
          }
        }
      }
    }, [value]);
    
    // Handle readOnly state changes
    useEffect(() => {
      if (editorRef.current) {
        editorRef.current.enable(!readOnly);
        
        // Find the toolbar for this specific editor instance
        if (toolbarRef.current) {
          // Use HTMLElement type assertion to access style property
          toolbarRef.current.style.display = readOnly ? 'none' : 'block';
        }
      }
    }, [readOnly]);
    
    return (
      <div className="quill-wrapper">
        {/* Custom toolbar with unique ID */}
        <div id={`toolbar-${editorId}`} ref={toolbarRef} className="quill-custom-toolbar">
          <span className="ql-formats">
            <button className="ql-bold"></button>
            <button className="ql-italic"></button>
          </span>
          <span className="ql-formats">
            <button className="ql-list" value="ordered"></button>
            <button className="ql-list" value="bullet"></button>
          </span>
        </div>
        
        {/* Editor container */}
        <div id={`editor-${editorId}`} ref={containerRef} className="quill-editor-container"></div>
      </div>
    );
  }
);

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor; 