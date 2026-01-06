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
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Application } from "@/lib/types";
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

const formSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters"),
  jobUrl: z.string().url().optional().or(z.literal('')),
});

export default function NewApplicationPage() {
  const [applications, setApplications] = useLocalStorage<Application[]>("applications", []);
  const [resume] = useLocalStorage<string>("resume", "");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [drafts, setDrafts] = useState<GenerateCustomApplicationDraftsOutput | null>(null);

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
                description: "Could not extract the job details. Please paste them manually.",
            });
        }
    } catch (error) {
        console.error("Failed to extract job description:", error);
        toast({
            variant: "destructive",
            title: "Extraction Failed",
            description: "An error occurred while extracting the job details. Please try again.",
        });
    } finally {
        setIsExtracting(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!resume) {
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
      const result = await generateCustomApplicationDrafts({ resume, ...values });
      setDrafts(result);
      
      const newApplication: Application = {
        id: crypto.randomUUID(),
        ...values,
        ...result,
        status: "Drafted",
        createdAt: new Date().toISOString(),
      };
      setApplications([newApplication, ...applications]);
      toast({
        title: "Drafts Generated",
        description: "Your cover letter and cold email are ready.",
      });
    } catch (error) {
      console.error("Failed to generate drafts:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "There was an error generating your application drafts. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
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
                                Extract
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
                <Button type="submit" disabled={isLoading || !resume} size="lg" className="w-full md:w-auto">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Generate Application Drafts
                </Button>
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
