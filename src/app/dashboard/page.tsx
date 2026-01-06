"use client";

import { useLocalStorage } from "@/hooks/use-local-storage";
import { Application, ApplicationStatus, APPLICATION_STATUSES } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCaption,
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
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const statusColors: Record<ApplicationStatus, string> = {
    Drafted: "bg-gray-500",
    Applied: "bg-blue-500",
    Interviewing: "bg-yellow-500",
    Rejected: "bg-red-500",
};

export default function DashboardPage() {
  const [applications, setApplications] = useLocalStorage<Application[]>("applications", []);

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
                <TableHead className="w-[35%]">Job Title</TableHead>
                <TableHead className="w-[20%]">Date</TableHead>
                <TableHead className="text-right w-[20%]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.companyName}</TableCell>
                  <TableCell>{app.jobTitle}</TableCell>
                  <TableCell>{format(new Date(app.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={app.status}
                      onValueChange={(value) => handleStatusChange(app.id, value as ApplicationStatus)}
                    >
                      <SelectTrigger className="w-[150px] ml-auto">
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
