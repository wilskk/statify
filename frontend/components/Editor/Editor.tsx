"use client";

import React, { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import type { Delta } from 'quill';

interface EditorProps {
  readOnly?: boolean;
  defaultValue?: string | Delta;
  onTextChange?: (delta: Delta, oldContents: Delta, source: string) => void;
  onSelectionChange?: (range: { index: number; length: number } | null, oldRange: { index: number; length: number } | null, source: string) => void;
  placeholder?: string;
}

// Editor is an uncontrolled React component
const Editor = forwardRef<any, EditorProps>(
  ({ readOnly = false, defaultValue, onTextChange, onSelectionChange, placeholder }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const defaultValueRef = useRef(defaultValue);
    const onTextChangeRef = useRef(onTextChange);
    const onSelectionChangeRef = useRef(onSelectionChange);

    useLayoutEffect(() => {
      onTextChangeRef.current = onTextChange;
      onSelectionChangeRef.current = onSelectionChange;
    });

    useEffect(() => {
      if (ref && typeof ref !== 'function' && ref.current) {
        ref.current.enable(!readOnly);
      }
    }, [ref, readOnly]);

    useEffect(() => {
      // Only run this effect on the client
      if (typeof window === 'undefined') return;
      
      // Dynamic import of Quill to avoid SSR issues
      const initEditor = async () => {
        const Quill = (await import('quill')).default;
        
        const container = containerRef.current;
        if (!container) return () => {};
        
        const editorContainer = container.appendChild(
          container.ownerDocument.createElement('div')
        );
        
        const quill = new Quill(editorContainer, {
          theme: 'snow',
          placeholder: placeholder,
          modules: {
            toolbar: [
              ['bold', 'italic'],
              [{ list: 'ordered' }, { list: 'bullet' }]
            ],
            clipboard: {
              matchVisual: false
            }
          },
          formats: ['bold', 'italic', 'list']
        });

        if (typeof ref === 'function') {
          ref(quill);
        } else if (ref) {
          ref.current = quill;
        }

        if (defaultValueRef.current) {
          if (typeof defaultValueRef.current === 'string') {
            try {
              // Handle HTML content
              quill.clipboard.dangerouslyPasteHTML(defaultValueRef.current);
            } catch (err) {
              console.log('Error setting content:', err);
            }
          } else {
            // Handle Delta content
            quill.setContents(defaultValueRef.current);
          }
        }

        quill.on(Quill.events.TEXT_CHANGE, (...args) => {
          onTextChangeRef.current?.(...args);
        });

        quill.on(Quill.events.SELECTION_CHANGE, (...args) => {
          onSelectionChangeRef.current?.(...args);
        });

        return () => {
          if (typeof ref === 'function') {
            ref(null);
          } else if (ref) {
            ref.current = null;
          }
          container.innerHTML = '';
        };
      };

      const cleanupPromise = initEditor();
      return () => {
        cleanupPromise.then(cleanupFn => cleanupFn && cleanupFn());
      };
    }, [ref]);

    return (
      <div className="quill-container">
        <div ref={containerRef} className="editor-container"></div>
        <style jsx global>{`
          .quill-container .ql-container {
            font-size: 14px !important;
            font-family: inherit !important;
            border: none !important;
          }
          .quill-container .ql-toolbar {
            border: none !important;
            border-bottom: 1px solid var(--border) !important;
            padding: 8px !important;
            background-color: hsl(var(--muted) / 0.3) !important;
          }
          .quill-container .ql-editor {
            min-height: 100px !important;
            padding: 12px !important;
            text-align: left !important;
          }
          .quill-container .ql-editor p {
            margin-bottom: 0.25rem !important;
            padding-left: 0 !important;
            text-indent: 0 !important;
          }
          /* Ensure proper text wrapping */
          .quill-container .ql-editor * {
            white-space: pre-wrap !important;
          }
          /* Make cursor aligned properly */
          .quill-container .ql-editor.ql-blank::before {
            left: 12px !important;
            font-style: italic !important;
            color: rgba(0, 0, 0, 0.4) !important;
          }
        `}</style>
      </div>
    );
  }
);

Editor.displayName = 'Editor';

export default Editor; 