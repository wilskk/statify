export interface ImportClipboardPasteStepProps {
  onClose: () => void;
  onTextPaste: (text: string) => void;
  onContinue: () => void;
  isLoading: boolean;
  error?: string | null;
  pastedText?: string | null;
  isMobile: boolean;
  isPortrait: boolean;
} 