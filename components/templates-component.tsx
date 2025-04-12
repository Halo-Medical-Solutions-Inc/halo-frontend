"use client";

import React from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, MoreHorizontal, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export default function TemplatesComponent() {
  // Fake user data
  const user = {
    name: "Dr. John Smith",
    email: "john.smith@example.com",
    default_template_id: "template2", // Template ID marked as default
  };

  // Fake templates data
  const templates = [
    {
      _id: "template1",
      name: "SOAP Note",
      status: "DEFAULT",
      created_at: "2023-05-10T09:30:00.000Z",
      modified_at: "2023-05-15T14:20:00.000Z",
    },
    {
      _id: "template2",
      name: "Progress Note",
      status: "READY",
      created_at: "2023-06-20T11:15:00.000Z",
      modified_at: "2023-07-05T16:45:00.000Z",
    },
    {
      _id: "template3",
      name: "Consultation",
      status: "READY",
      created_at: "2023-07-30T10:00:00.000Z",
      modified_at: "2023-08-02T13:30:00.000Z",
    },
    {
      _id: "template4",
      name: "Physical Examination",
      status: "READY",
      created_at: "2023-08-10T09:00:00.000Z",
      modified_at: "2023-08-10T09:00:00.000Z",
    },
  ];

  return (
    <SidebarInset>
      <header className="flex h-14 shrink-0 items-center gap-2">
        <div className="flex flex-1 items-center gap-2 px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">
                  Template Center
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 py-10">
        <div className="mx-auto h-full w-full max-w-3xl rounded-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl md:text-xl font-bold">Template Center</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button>
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </div>
          </div>

          <Separator />
          <div className="flex flex-col gap-2">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs font-normal text-muted-foreground py-3 px-3 w-[60%]">
                    NAME
                  </TableHead>
                  <TableHead className="text-xs font-normal text-muted-foreground py-3 w-[30%]">
                    LAST MODIFIED
                  </TableHead>
                  <TableHead className="text-xs text-right font-normal text-muted-foreground py-3 w-[10%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="relative">
                {templates
                  .sort((a, b) => {
                    const dateA = a.modified_at
                      ? new Date(a.modified_at).getTime()
                      : 0;
                    const dateB = b.modified_at
                      ? new Date(b.modified_at).getTime()
                      : 0;
                    return dateB - dateA;
                  })
                  .map((template) => (
                    <TableRow
                      key={template._id}
                      className={`${template.status !== "DEFAULT" ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      <TableCell className="font-normal text-primary p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="pt-0.5">
                              {template.name || "New Template"}{" "}
                            </span>
                            {template._id === user.default_template_id && (
                              <Badge
                                variant="outline"
                                className="border-success-border bg-success-secondary text-success px-1.5 py-0.5 rounded"
                              >
                                Default
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {template.status === "DEFAULT"
                              ? "Created by HALO"
                              : "Created by you"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-normal text-primary">
                        {template.modified_at
                          ? new Date(template.modified_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                                hour12: true,
                              },
                            )
                          : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-auto" align="end">
                            <DropdownMenuItem
                              onClick={(e) => e.stopPropagation()}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Set Default</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Copy className="h-4 w-4" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            {template.status !== "DEFAULT" && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive hover:text-destructive"
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span>Delete Template</span>
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the template.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
