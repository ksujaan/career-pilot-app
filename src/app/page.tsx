"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  generateCustomApplicationDrafts,
  GenerateCustomApplicationDraftsOutput,
} from "@/ai/flows/generate-custom-application-drafts";
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
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  jobDescription: z.string().min(50, "Job description must be at least 50 characters"),
});

export default function NewApplicationPage() {
  const [applications, setApplications] = useLocalStorage<Application[]>("applications", []);
  const [resume] = useLocalStorage<string>("resume", "");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [drafts, setDrafts] = useState<GenerateCustomApplicationDraftsOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      jobTitle: "",
      jobDescription: "",
    },
  });

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
                Enter the job details below to generate tailored application materials.
            </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>
              Fill in the information for the job you're applying for.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste the job description here..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Drafts
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
