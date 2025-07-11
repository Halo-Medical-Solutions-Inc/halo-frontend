"use client";

import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, MoreHorizontal, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setSelectedTemplate, setTemplates } from "@/store/slices/templateSlice";
import { useDispatch } from "react-redux";
import { Template } from "@/store/types";
import { setScreen } from "@/store/slices/sessionSlice";
import useWebSocket, { handle } from "@/lib/websocket";
import { formatLocalDateAndTime, useDebouncedSend } from "@/lib/utils";
import { setUser } from "@/store/slices/userSlice";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNextStep } from "nextstepjs";

export default function TemplatesComponent() {
  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const { send } = useWebSocket();
  const debouncedSend = useDebouncedSend(send);
  const { setCurrentStep, currentTour } = useNextStep();

  const session = useSelector((state: RootState) => state.session.session);
  const user = useSelector((state: RootState) => state.user.user);
  const templates = useSelector((state: RootState) => state.template.templates);

  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);
  const [isDuplicatingTemplate, setIsDuplicatingTemplate] = useState(false);

  useEffect(() => {
    const createTemplateHandler = handle("create_template", "templates", (data) => {
      if (data.was_requested) {
        console.log("Processing create_template in templates");

        setIsCreatingTemplate(false);

        if (currentTour === "template-tour") {
          setCurrentStep(1);
        }
      }
    });

    const deleteTemplateHandler = handle("delete_template", "templates", (data) => {
      if (data.was_requested) {
        console.log("Processing delete_template in templates");
        setIsDeletingTemplate(false);
      }
    });

    const duplicateTemplateHandler = handle("duplicate_template", "templates", (data) => {
      if (data.was_requested) {
        console.log("Processing duplicate_template in templates");
        setIsDuplicatingTemplate(false);
      }
    });

    return () => {
      createTemplateHandler();
      deleteTemplateHandler();
      duplicateTemplateHandler();
    };
  }, []);

  const selectTemplate = (template: Template) => {
    if (template.status !== "DEFAULT") {
      dispatch(setScreen("TEMPLATE"));
      dispatch(setSelectedTemplate(template));
    }
  };

  const createTemplate = () => {
    setIsCreatingTemplate(true);
    debouncedSend({
      type: "create_template",
      session_id: session.session_id,
      data: {},
    });
  };

  const deleteTemplate = (template: Template) => {
    setIsDeletingTemplate(true);
    debouncedSend({
      type: "delete_template",
      session_id: session.session_id,
      data: {
        template_id: template.template_id,
      },
    });
  };

  const duplicateTemplate = (template: Template) => {
    setIsDuplicatingTemplate(true);
    send({
      type: "duplicate_template",
      session_id: session.session_id,
      data: {
        template_id: template.template_id,
      },
    });
  };

  const setDefaultTemplate = (template: Template) => {
    dispatch(setUser({ ...user, default_template_id: template.template_id }));
    send({
      type: "update_user",
      session_id: session.session_id,
      data: {
        user_id: user?.user_id,
        default_template_id: template.template_id,
      },
    });
  };

  return (
    <SidebarInset>
      <header className="flex h-14 shrink-0 items-center gap-2">
        <div className="flex flex-1 items-center gap-2 px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {!isMobile && (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">Template Center</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 py-10">
        <div className="mx-auto h-full w-full max-w-3xl rounded-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
            <div className="flex items-center gap-2 justify-between">
              <h2 className="text-xl md:text-xl font-bold">Template Center</h2>
              {isMobile && (
                <Button size="icon" onClick={createTemplate} disabled={isCreatingTemplate}>
                  {isCreatingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {!isMobile && (
              <div className="flex items-center gap-2">
                <Button onClick={createTemplate} disabled={isCreatingTemplate} id="template-tour-create-new">
                  {isCreatingTemplate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {" "}
                      <Plus className="h-4 w-4" /> Create
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <Separator />
          <div className="flex flex-col gap-2">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs font-normal text-muted-foreground py-3 px-3 w-[60%]">NAME</TableHead>
                  {!isMobile && <TableHead className="text-xs font-normal text-muted-foreground py-3 w-[30%]">LAST MODIFIED</TableHead>}
                  <TableHead className="text-xs text-right font-normal text-muted-foreground py-3 w-[10%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="relative">
                {[...templates]
                  .sort((a, b) => {
                    const dateA = a.modified_at ? new Date(a.modified_at).getTime() : 0;
                    const dateB = b.modified_at ? new Date(b.modified_at).getTime() : 0;
                    return dateB - dateA;
                  })
                  .map((template) => (
                    <TableRow key={template.template_id} className={`${template.status !== "DEFAULT" ? "cursor-pointer" : "cursor-not-allowed"}`} onClick={() => template.status !== "DEFAULT" && selectTemplate(template)}>
                      <TableCell className="font-normal text-primary p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="pt-0.5">{template.name || "New Template"} </span>
                            {template.template_id === user?.default_template_id && (
                              <Badge variant="outline" className="border-success-border bg-success-secondary text-success px-1.5 py-0.5 rounded">
                                Default
                              </Badge>
                            )}
                            {template.status === "EMR" && (
                              <Badge variant="outline" className="border-info-border bg-info-secondary text-info px-1.5 py-0.5 rounded">
                                EMR
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{template.status === "DEFAULT" ? "Created by HALO" : "Created by you"}</span>
                        </div>
                      </TableCell>
                      {!isMobile && <TableCell className="font-normal text-primary">{template.modified_at ? formatLocalDateAndTime(template.modified_at) : "00:00 AM"}</TableCell>}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-auto" align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setDefaultTemplate(template);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Set Default</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                duplicateTemplate(template);
                              }}
                            >
                              {isDuplicatingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
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
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete the template. This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        deleteTemplate(template);
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {isDeletingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
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
