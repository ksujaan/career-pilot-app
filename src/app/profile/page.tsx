"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const [resume, setResume] = useLocalStorage<string>("resume", "");

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
              Paste your complete resume here. It will be saved locally in your
              browser and used to generate tailored application materials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="resume">Resume Content</Label>
              <Textarea
                id="resume"
                placeholder="Paste your resume content here..."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                className="min-h-[50vh]"
              />
              <p className="text-sm text-muted-foreground">
                Your resume is stored only on this device and is not sent to any server until you generate drafts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
