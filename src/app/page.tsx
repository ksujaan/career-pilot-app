"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  generateCustomApplicationDrafts,
  GenerateCustomApplicationDraftsOutput,
} from "@/ai/flows/generate-custom-application-drafts";
import { extractJobDescription } from "@/ai/flows/extract-job-description";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CopyButton } from "@/components/copy-button";
import { Loader2, Sparkles, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebase, useMemoFirebase, useUser } from "@/firebase";
import { doc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";

const formSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters"),
  jobUrl: z.string().url().optional().or(z.literal('')),
});

export default function NewApplicationPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [drafts, setDrafts] = useState<GenerateCustomApplicationDraftsOutput | null>(null);

  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const profileRef = useMemoFirebase(() => 
    user ? doc(firestore, `users/${user.uid}/profile/main`) : null, 
    [user, firestore]
  );
  const { data: profile } = useDoc(profileRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      jobTitle: "",
      jobDescription: "",
      jobUrl: "",
    },
  });

  async function handleExtractDescription() {
    const jobUrl = form.getValues("jobUrl");
    if (!jobUrl) {
        toast({
            variant: "destructive",
            title: "No URL provided",
            description: "Please enter a URL to extract the job details from.",
        });
        return;
    }

    setIsExtracting(true);
    try {
        const result = await extractJobDescription({ jobUrl });
        if (result.jobDescription || result.jobTitle || result.companyName) {
            form.setValue("jobDescription", result.jobDescription);
            form.setValue("jobTitle", result.jobTitle);
            form.setValue("companyName", result.companyName);
            toast({
                title: "Extraction Successful",
                description: "The job details have been extracted from the URL.",
            });
        } else {
             toast({
                variant: "destructive",
                title: "Extraction Failed",
                description: "Could not extract the job details. The AI was unable to parse the content. Please paste them manually.",
            });
        }
    } catch (error: any) {
        console.error("Failed to extract job description:", error);
        toast({
            variant: "destructive",
            title: "Extraction Failed",
            description: error.message || "An unknown error occurred. Please check the console for details.",
        });
    } finally {
        setIsExtracting(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
        toast({
            variant: "destructive",
            title: "Not Signed In",
            description: "You must be signed in to create an application.",
        });
        return;
    }
    if (!profile?.resume) {
      toast({
        variant: "destructive",
        title: "No Resume Found",
        description: "Please add your resume in the Profile page before generating drafts.",
      });
      return;
    }
    
    setIsLoading(true);
    setDrafts(null);
    try {
      const result = await generateCustomApplicationDrafts({ resume: profile.resume, ...values });
      setDrafts(result);
      
      const newApplicationId = doc(collection(firestore, 'a-path')).id;
      const applicationRef = doc(firestore, `users/${user.uid}/applications/${newApplicationId}`);

      await setDoc(applicationRef, {
        id: newApplicationId,
        ...values,
        ...result,
        status: "Drafted",
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Drafts Generated & Saved",
        description: "Your new application has been saved to your dashboard.",
      });
    } catch (error: any) {
      console.error("Failed to generate drafts:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "There was an error generating your application drafts. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
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
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        Please sign in to manage your job applications.
                    </p>
                    {/* The login button will be in the header */}
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 md:px-6">
      <div className="space-y-8">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">New Application</h1>
            <p className="text-muted-foreground">
                Enter job details manually or provide a URL to auto-fill the description.
            </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Google" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Software Engineer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                    control={form.control}
                    name="jobUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Post URL (LinkedIn, etc.)</FormLabel>
                        <div className="flex items-center gap-2">
                            <FormControl>
                            <Input placeholder="https://www.linkedin.com/jobs/view/..." {...field} />
                            </FormControl>
                            <Button type="button" onClick={handleExtractDescription} disabled={isExtracting || !form.watch('jobUrl')} variant="outline">
                                {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                <span className="hidden sm:inline">Extract</span>
                            </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste the job description here, or use the extractor above."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading || !profile?.resume} size="lg" className="w-full md:w-auto">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Generate Application Drafts
                </Button>
                 {!profile?.resume && (
                    <p className="text-sm text-muted-foreground">
                        You need to upload a resume on the Profile page before you can generate drafts.
                    </p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {(isLoading || drafts) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {isLoading ? (
                <>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-4 w-full mt-2" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-4 w-full mt-2" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                    </Card>
                </>
            ) : drafts && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="space-y-1.5">
                        <CardTitle>Cover Letter</CardTitle>
                        <CardDescription>A professional, tailored cover letter.</CardDescription>
                    </div>
                    <CopyButton textToCopy={drafts.coverLetter} />
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-80 w-full rounded-md border p-4">
                      <p className="whitespace-pre-wrap text-sm">{drafts.coverLetter}</p>
                    </ScrollArea>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="space-y-1.5">
                        <CardTitle>Cold Email</CardTitle>
                        <CardDescription>A concise email for the recruiter.</CardDescription>
                    </div>
                    <CopyButton textToCopy={drafts.coldEmail} />
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-80 w-full rounded-md border p-4">
                      <p className="whitespace-pre-wrap text-sm">{drafts.coldEmail}</p>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
