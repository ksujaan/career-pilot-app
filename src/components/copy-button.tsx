"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClipboardCopy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CopyButtonProps {
  textToCopy: string;
}

export function CopyButton({ textToCopy }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setHasCopied(true);
      toast({
        title: "Copied to clipboard!",
      });
      setTimeout(() => {
        setHasCopied(false);
      }, 2000);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
        toast({
            variant: "destructive",
            title: "Failed to copy",
            description: "Could not copy text to clipboard."
        });
    });
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy}>
      {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
      <span className="sr-only">Copy to clipboard</span>
    </Button>
  );
}
