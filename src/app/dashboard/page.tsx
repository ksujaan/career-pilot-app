"use client";

import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Application, ApplicationStatus, APPLICATION_STATUSES } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye } from "lucide-react";
import { CopyButton } from "@/components/copy-button";

const statusColors: Record<ApplicationStatus, string> = {
    Drafted: "bg-gray-500",
    Applied: "bg-blue-500",
    Interviewing: "bg-yellow-500",
    Rejected: "bg-red-500",
};

export default function DashboardPage() {
  const [applications, setApplications] = useLocalStorage<Application[]>("applications", []);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const handleStatusChange = (applicationId: string, newStatus: ApplicationStatus) => {
    setApplications(
      applications.map((app) =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      )
    );
  };
  
  if (applications.length === 0) {
    return (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <CardTitle>No Applications Yet</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        You haven't created any job applications. Let's get started!
                    </p>
                    <Button asChild>
                        <Link href="/">Create Your First Application</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
        <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Application Tracker</h1>
            <p className="text-muted-foreground">
                Manage and track all your job applications in one place.
            </p>
        </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Company</TableHead>
                <TableHead className="w-[30%]">Job Title</TableHead>
                <TableHead className="w-[15%]">Date</TableHead>
                <TableHead className="w-[20%]">Status</TableHead>
                <TableHead className="text-right w-[10%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.companyName}</TableCell>
                  <TableCell>{app.jobTitle}</TableCell>
                  <TableCell>{format(new Date(app.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Select
                      value={app.status}
                      onValueChange={(value) => handleStatusChange(app.id, value as ApplicationStatus)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Set status" />
                      </SelectTrigger>
                      <SelectContent>
                        {APPLICATION_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
                                {status}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedApplication(null)}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedApplication(app)}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View Drafts</span>
                            </Button>
                        </DialogTrigger>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

        {selectedApplication && (
             <Dialog open={!!selectedApplication} onOpenChange={(isOpen) => !isOpen && setSelectedApplication(null)}>
                <DialogContent className="max-w-4xl h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Application Drafts for {selectedApplication.jobTitle} at {selectedApplication.companyName}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 h-full overflow-hidden">
                        <div className="flex flex-col gap-2 h-full">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Cover Letter</h3>
                                <CopyButton textToCopy={selectedApplication.coverLetter} />
                            </div>
                            <ScrollArea className="border rounded-md p-4 h-full">
                                <p className="text-sm whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                            </ScrollArea>
                        </div>
                         <div className="flex flex-col gap-2 h-full">
                             <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Cold Email</h3>
                                <CopyButton textToCopy={selectedApplication.coldEmail} />
                            </div>
                            <ScrollArea className="border rounded-md p-4 h-full">
                                <p className="text-sm whitespace-pre-wrap">{selectedApplication.coldEmail}</p>
                            </ScrollArea>
                        </div>
                    </div>
                </DialogContent>
             </Dialog>
        )}
    </div>
  );
}
