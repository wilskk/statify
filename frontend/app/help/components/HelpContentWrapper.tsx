import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface HelpContentWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  hasCard?: boolean;
}

export const HelpContentWrapper: React.FC<HelpContentWrapperProps> = ({ 
  children, 
  title, 
  description,
  hasCard = true 
}) => {
  const content = (
    <>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </>
  );

  if (hasCard) {
    return <div className="space-y-5">{content}</div>;
  }

  return content;
}; 