"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, CalendarIcon, Briefcase, Building, Loader2 } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { useFirebase, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";

const statusColors: Record<ApplicationStatus, string> = {
    Drafted: "bg-gray-500",
    Applied: "bg-blue-500",
    Interviewing: "bg-yellow-500",
    Rejected: "bg-red-500",
};

export default function DashboardPage() {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();

  const applicationsCollectionRef = useMemoFirebase(
    () => (user ? collection(firestore, `users/${user.uid}/applications`) : null),
    [user, firestore]
  );

  const { data: applications, isLoading: isLoadingApplications } = useCollection<Application>(applicationsCollectionRef);

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
    if (!user) return;
    const appDocRef = doc(firestore, `users/${user.uid}/applications`, applicationId);
    try {
        await updateDoc(appDocRef, { status: newStatus });
    } catch (error) {
        console.error("Error updating status: ", error);
    }
  };

  if (isUserLoading || isLoadingApplications) {
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
                        Please sign in to view your dashboard.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!applications || applications.length === 0) {
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
    <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Application Tracker</h1>
            <p className="text-muted-foreground">
                Manage and track all your job applications in one place.
            </p>
        </div>
        
      <Card className="hidden md:block">
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
      
        <div className="grid gap-4 md:hidden">
            {applications.map((app) => (
                <Card key={app.id}>
                    <CardHeader>
                        <CardTitle className="text-lg">{app.jobTitle}</CardTitle>
                        <CardDescription>
                            <div className="flex items-center gap-2 text-muted-foreground pt-1">
                                <Building className="h-4 w-4" />
                                <span>{app.companyName}</span>
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(app.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                        <Select
                            value={app.status}
                            onValueChange={(value) => handleStatusChange(app.id, value as ApplicationStatus)}
                        >
                            <SelectTrigger>
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
                    </CardContent>
                    <CardFooter>
                         <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedApplication(null)}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full" onClick={() => setSelectedApplication(app)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Drafts
                                </Button>
                            </DialogTrigger>
                        </Dialog>
                    </CardFooter>
                </Card>
            ))}
        </div>

        {selectedApplication && (
             <Dialog open={!!selectedApplication} onOpenChange={(isOpen) => !isOpen && setSelectedApplication(null)}>
                <DialogContent className="max-w-4xl h-full md:h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Application for {selectedApplication.jobTitle} at {selectedApplication.companyName}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-1 min-h-0">
                        <div className="flex flex-col gap-2 min-h-0">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Cover Letter</h3>
                                <CopyButton textToCopy={selectedApplication.coverLetter} />
                            </div>
                            <ScrollArea className="border rounded-md p-4 flex-1">
                                <p className="text-sm whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                            </ScrollArea>
                        </div>
                         <div className="flex flex-col gap-2 min-h-0">
                             <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Cold Email</h3>
                                <CopyButton textToCopy={selectedApplication.coldEmail} />
                            </div>
                            <ScrollArea className="border rounded-md p-4 flex-1">
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
