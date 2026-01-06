"use client";

import { useState } from "react";
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
import { UploadCloud, FileText, X, Loader2, Sparkles } from "lucide-react";
import * as pdfjs from 'pdfjs-dist';
import { Textarea } from "@/components/ui/textarea";
import { summarizeResume } from "@/ai/flows/summarize-resume";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebase, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { LoginButton } from "@/components/auth/login-button";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function ProfilePage() {
  const [isParsing, setIsParsing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const profileRef = useMemoFirebase(() => 
    user ? doc(firestore, `users/${user.uid}/profile/main`) : null, 
    [user, firestore]
  );
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const isLoading = isParsing || isSummarizing || isUserLoading || isProfileLoading;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!profileRef) return;
    
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
      setIsParsing(true);
      
      try {
        await setDoc(profileRef, { resumeFileName: file.name }, { merge: true });
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(arrayBuffer).promise;
        let textContent = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(item => ('str' in item ? item.str : '')).join(" ") + "\n";
        }
        setIsParsing(false);
        
        setIsSummarizing(true);
        const { cleanedText, summary } = await summarizeResume({ resumeText: textContent });
        
        await setDoc(profileRef, {
          resume: cleanedText,
          resumeSummary: summary,
        }, { merge: true });

        toast({
          title: "Resume Processed",
          description: "Your resume has been parsed, summarized, and saved.",
        });
      } catch (error) {
        console.error("Failed to process PDF:", error);
        toast({
          variant: "destructive",
          title: "Processing Failed",
          description: "There was an error reading and saving your resume.",
        });
        await setDoc(profileRef, { resume: "", resumeSummary: "", resumeFileName: "" }, { merge: true });
      } finally {
        setIsParsing(false);
        setIsSummarizing(false);
      }
    }
  };
  
  const handleRemoveResume = async () => {
    if (!profileRef) return;

    await setDoc(profileRef, {
        resume: "",
        resumeSummary: "",
        resumeFileName: ""
    }, { merge: true });

    const input = document.getElementById('resume-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    toast({
        title: "Resume Removed",
        description: "Your resume has been cleared from your profile.",
    });
  }

  if (isUserLoading) {
    return (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) {
    return (
         <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <CardTitle>Welcome to CareerPilot</CardTitle>
                     <CardDescription>
                        Your AI-powered job application assistant.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        Please sign in to manage your profile.
                    </p>
                    <div className="w-full sm:w-auto sm:mx-auto">
                        <LoginButton />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 md:px-6">
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
              Upload your resume as a PDF. It will be saved to your profile, processed by AI, and used to generate tailored application materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid w-full gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="resume-upload">Upload PDF</Label>
                 {profile?.resumeFileName && !isLoading ? (
                  <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-6 w-6 shrink-0 text-primary" />
                        <span className="font-medium text-sm truncate">{profile.resumeFileName}</span>
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
                    {isParsing || isSummarizing ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="mt-2 text-sm text-muted-foreground">{isSummarizing ? "AI is processing..." : "Reading PDF..."}</p>
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
                Your resume is stored securely in your Firebase account.
              </p>
            </div>
            
            {(isLoading || profile?.resume) && (
              <div className="space-y-6">
                {isSummarizing || profile?.resumeSummary ? (
                   <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            AI-Generated Summary
                        </Label>
                        {isSummarizing || (isProfileLoading && !profile?.resumeSummary) ? (
                             <Card className="p-4 bg-muted/50 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </Card>
                        ) : profile?.resumeSummary && (
                            <Card className="p-4 bg-muted/50">
                                <p className="text-sm">{profile.resumeSummary}</p>
                            </Card>
                        )}
                   </div>
                ) : null}

                {isParsing || profile?.resume ? (
                    <div className="space-y-2">
                        <Label>Parsed & Cleaned Resume Content</Label>
                        {isParsing && !profile?.resume ? (
                             <Textarea 
                                readOnly
                                value="Parsing PDF..."
                                className="min-h-[300px] bg-muted/50"
                            />
                        ) : (
                             <Textarea 
                                readOnly
                                value={profile?.resume || ""}
                                className="min-h-[300px] bg-muted/50 whitespace-pre-wrap"
                                placeholder="Parsed resume content will appear here..."
                            />
                        )}
                    </div>
                 ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
