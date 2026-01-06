"use client";

import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
import { Textarea } from "@/components/ui/textarea";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

export default function ProfilePage() {
  const [resume, setResume] = useLocalStorage<string>("resume", "");
  const [fileName, setFileName] = useLocalStorage<string | null>("resume-filename", null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
        });
        return;
      }
      setIsLoading(true);
      setFileName(file.name);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(arrayBuffer).promise;
        let textContent = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(item => ('str' in item ? item.str : '')).join(" ") + "\n";
        }
        setResume(textContent);
        toast({
          title: "Resume Uploaded",
          description: "Your resume has been successfully parsed.",
        });
      } catch (error) {
        console.error("Failed to parse PDF:", error);
        toast({
          variant: "destructive",
          title: "PDF Parsing Failed",
          description: "There was an error reading your resume. Please try again or use a different file.",
        });
        setFileName(null);
        setResume("");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleRemoveResume = () => {
    setResume("");
    setFileName(null);
    const input = document.getElementById('resume-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    toast({
        title: "Resume Removed",
        description: "Your resume has been cleared.",
    });
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">
            Manage your professional information.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Master Resume/CV</CardTitle>
            <CardDescription>
              Upload your resume as a PDF. It will be saved locally in your
              browser and used to generate tailored application materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid w-full gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="resume-upload">Upload PDF</Label>
                 {fileName ? (
                  <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary" />
                        <span className="font-medium text-sm">{fileName}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleRemoveResume} disabled={isLoading}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove resume</span>
                    </Button>
                  </div>
                ) : (
                <div className="relative">
                  <Input
                    id="resume-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    disabled={isLoading}
                  />
                  <div className="flex h-32 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-input bg-background text-center transition-colors hover:border-primary">
                    {isLoading ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="mt-2 text-sm text-muted-foreground">Processing PDF...</p>
                        </>
                    ) : (
                        <>
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">PDF only</p>
                        </>
                    )}
                  </div>
                </div>
                )}
              </div>
               <p className="text-sm text-muted-foreground">
                Your resume is stored only on this device and is not sent to any server until you generate drafts.
              </p>
            </div>
            {resume && (
                <div className="space-y-2">
                    <Label>Parsed Resume Content</Label>
                    <Textarea 
                        readOnly
                        value={resume}
                        className="min-h-[300px] bg-muted/50"
                        placeholder="Parsed resume content will appear here..."
                    />
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
