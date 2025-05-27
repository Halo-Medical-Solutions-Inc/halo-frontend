import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Printer, Download, RefreshCw, Trash2, Copy, Check, Loader2, DownloadCloud, FileText, FileImage } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ExpandingTextarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setSelectedVisit } from "@/store/slices/visitSlice";
import useWebSocket, { handle } from "@/lib/websocket";
import { useDebouncedSend, printNote as printNoteUtil, downloadNoteAsPDF as downloadNoteAsPDFUtil, formatTranscriptTime, downloadNoteAsWord as downloadNoteAsWordUtil } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

export default function NoteComponent() {
  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const { send } = useWebSocket();
  const debouncedSend = useDebouncedSend(send);

  const session = useSelector((state: RootState) => state.session.session);
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);
  const templates = useSelector((state: RootState) => state.template.templates);

  const [transcriptView, setTranscriptView] = useState(false);
  const [isDeletingVisit, setIsDeletingVisit] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const deleteVisitHandler = handle("delete_visit", "note", (data) => {
      if (data.was_requested) {
        console.log("Processing delete_visit in note");
        setIsDeletingVisit(false);
      }
    });

    return () => {
      deleteVisitHandler();
    };
  }, []);

  const nameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSelectedVisit({ ...selectedVisit, name: e.target.value }));
    debouncedSend({
      type: "update_visit",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
        name: e.target.value,
      },
    });
  };

  const noteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setSelectedVisit({ ...selectedVisit, note: e.target.value }));
    debouncedSend({
      type: "update_visit",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
        note: e.target.value,
      },
    });
  };

  const selectTemplate = (value: string) => {
    if (value === "transcript") {
      setTranscriptView(true);
    } else {
      setTranscriptView(false);
      dispatch(setSelectedVisit({ ...selectedVisit, template_id: value }));
      send({
        type: "update_visit",
        session_id: session.session_id,
        data: {
          visit_id: selectedVisit?.visit_id,
          template_id: value,
        },
      });

      if (value != selectedVisit?.template_id) {
        regenerateNote(value);
      }
    }
  };

  const deleteVisit = () => {
    setIsDeletingVisit(true);
    send({
      type: "delete_visit",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
      },
    });
  };

  const regenerateNote = (template_id: string) => {
    send({
      type: "generate_note",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
        template_id: template_id,
      },
    });
    dispatch(setSelectedVisit({ ...selectedVisit, template_id: template_id, status: "FRONTEND_TRANSITION" }));
  };

  const printNote = () => {
    const name = selectedVisit?.name || "New Visit";
    const content = transcriptView ? selectedVisit?.transcript || "" : selectedVisit?.note || "";
    const templateId = selectedVisit?.template_id || "";
    const template = templates.find((t) => t.template_id === templateId);
    const header = template?.header || "";
    const footer = template?.footer || "";
    printNoteUtil(name, content, header, footer);
  };

  const downloadNote = (format: "pdf" | "docx") => {
    const name = selectedVisit?.name || "New Visit";
    const content = transcriptView ? selectedVisit?.transcript || "" : selectedVisit?.note || "";
    const templateId = selectedVisit?.template_id || "";
    const template = templates.find((t) => t.template_id === templateId);
    const header = template?.header || "";
    const footer = template?.footer || "";

    if (format === "pdf") {
      downloadNoteAsPDFUtil(name, content, header, footer);
    } else {
      downloadNoteAsWordUtil(name, content, header, footer);
    }
  };

  const copyAllNote = () => {
    const textToCopy = transcriptView ? selectedVisit?.transcript + "\n\n" + selectedVisit?.additional_context : selectedVisit?.note;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <SidebarInset>
      <header className="flex h-14 shrink-0 items-center gap-2">
        <div className="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">{!isMobile && (selectedVisit?.name || "New Visit")}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center">
              <span className="font-normal text-muted-foreground md:inline-block">
                {!isMobile && selectedVisit?.recording_duration
                  ? `${Math.floor(selectedVisit.recording_duration / 60)
                      .toString()
                      .padStart(2, "0")}:${(selectedVisit.recording_duration % 60).toString().padStart(2, "0")}`
                  : !isMobile && "00:00"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-1">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-auto" align="end">
                  <DropdownMenuItem onClick={printNote}>
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Download className="h-4 w-4 text-muted-foreground mr-2" />
                      <span>Download</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => downloadNote("pdf")}>
                        <FileImage className="h-4 w-4" />
                        <span>PDF</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadNote("docx")}>
                        <FileText className="h-4 w-4" />
                        <span>Word</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem onClick={() => regenerateNote(selectedVisit?.template_id || "")}>
                    <RefreshCw className="h-4 w-4" />
                    <span>Regenerate</span>
                  </DropdownMenuItem>
                  <AlertDialog key={selectedVisit?.visit_id}>
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
                        <span>Delete Visit</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the visit. This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteVisit();
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isDeletingVisit}
                        >
                          {isDeletingVisit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 px-4 py-10">
        <div className="mx-auto h-full w-full max-w-3xl rounded-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4">
            {isMobile ? (
              <div className="flex items-center justify-between w-full gap-2">
                <Input value={selectedVisit?.name} onChange={nameChange} placeholder="New Visit" className="text-xl font-bold w-full shadow-none border-none outline-none p-0 focus:ring-0 focus:outline-none resize-none overflow-hidden text-left" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const dropdown = document.createElement("select");
                      dropdown.click();
                    }}
                  >
                    <div className="relative">
                      <FileText className="h-4 w-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10" />
                      <Select value={transcriptView ? "transcript" : selectedVisit?.template_id} onValueChange={selectTemplate}>
                        <SelectTrigger className="h-10 w-10 p-0 border-none opacity-0"></SelectTrigger>
                        <SelectContent align="end">
                          <SelectGroup>
                            <SelectLabel>Templates</SelectLabel>
                            <SelectItem value="transcript">Transcript</SelectItem>
                            {templates.map((template) => (
                              <SelectItem key={template.template_id} value={template.template_id || ""}>
                                {template.name || "Unnamed Template"}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </Button>
                  <Button variant="default" size="icon" onClick={copyAllNote}>
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Input value={selectedVisit?.name} onChange={nameChange} placeholder="New Visit" className="text-xl md:text-xl font-bold w-full shadow-none border-none outline-none p-0 focus:ring-0 focus:outline-none resize-none overflow-hidden text-left" />
              </div>
            )}
            {!isMobile && (
              <div className="flex items-center gap-2">
                <Select value={transcriptView ? "transcript" : selectedVisit?.template_id} onValueChange={selectTemplate}>
                  <SelectTrigger className="min-w-[50px] max-w-[240px] w-auto">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectGroup>
                      <SelectLabel>Templates</SelectLabel>
                      <SelectItem value="transcript">Transcript</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.template_id} value={template.template_id || ""}>
                          {template.name || "Unnamed Template"}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button onClick={copyAllNote}>
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy all
                </Button>
              </div>
            )}
          </div>

          {selectedVisit?.template_modified_at && selectedVisit?.template_id && templates.find((t) => t.template_id === selectedVisit.template_id)?.modified_at && new Date(selectedVisit.template_modified_at.replace(" ", "T") + "Z") < new Date((templates.find((t) => t.template_id === selectedVisit.template_id)?.modified_at || "").replace(" ", "T") + "Z") && !transcriptView && (
            <div className="flex items-center justify-between p-4 w-full bg-muted rounded-md border-border border">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Template Updated</span>
                <span className="text-sm text-muted-foreground">The template seems to be updated. Please regenerate.</span>
              </div>
              <Button onClick={() => regenerateNote(selectedVisit?.template_id || "")}>
                {selectedVisit?.status === "FRONTEND_TRANSITION" || selectedVisit?.status === "GENERATING_NOTE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {selectedVisit?.status === "FRONTEND_TRANSITION" || selectedVisit?.status === "GENERATING_NOTE" ? "Regenerating" : "Regenerate"}
              </Button>
            </div>
          )}

          <Separator />

          <div className="flex flex-col gap-3">
            {transcriptView ? (
              <>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="w-full flex items-center relative group">
                      <span className="text-sm font-bold text-primary truncate">TRANSCRIPT</span>
                    </div>
                  </div>
                  <div className="relative group mt-2">
                    <ExpandingTextarea id={`transcript`} minHeight={0} maxHeight={10000} value={formatTranscriptTime(selectedVisit?.transcript)} disabled={true} className="w-full text-muted-foreground text-sm flex-1 resize-none border-none p-0 leading-relaxed focus:ring-0 focus:outline-none focus:shadow-none placeholder:text-muted-foreground rounded-none" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="w-full flex items-center relative group">
                      <span className="text-sm font-bold text-primary truncate">ADDITIONAL CONTEXT</span>
                    </div>
                  </div>
                  <div className="relative group mt-2">
                    <ExpandingTextarea id={`additional-context`} minHeight={0} maxHeight={10000} value={selectedVisit?.additional_context} disabled={true} className="w-full text-muted-foreground text-sm flex-1 resize-none border-none p-0 leading-relaxed focus:ring-0 focus:outline-none focus:shadow-none placeholder:text-muted-foreground rounded-none" />
                  </div>
                </div>
              </>
            ) : (
              <div className="relative group">
                {selectedVisit?.status === "FRONTEND_TRANSITION" ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-[20%]" />
                      <Skeleton className="h-4 w-[50%]" />
                      <Skeleton className="h-4 w-[30%]" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-[40%]" />
                      <Skeleton className="h-4 w-[60%]" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-[80%]" />
                      <Skeleton className="h-4 w-[20%]" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-[30%]" />
                      <Skeleton className="h-4 w-[30%]" />
                      <Skeleton className="h-4 w-[40%]" />
                    </div>
                  </div>
                ) : (
                  <ExpandingTextarea id={`note`} minHeight={0} maxHeight={10000} value={selectedVisit?.note} onChange={noteChange} className="w-full text-foreground text-sm flex-1 resize-none border-none p-0 leading-relaxed focus:ring-0 focus:outline-none focus:shadow-none placeholder:text-muted-foreground rounded-none" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
