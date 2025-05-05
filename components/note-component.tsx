import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Printer, Download, RefreshCw, Trash2, Copy, Check, Loader2 } from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ExpandingTextarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { setSelectedVisit, setVisits } from "@/store/slices/visitSlice";
import useWebSocket, { handle } from "@/lib/websocket";
import { useDebouncedSend, printNote as printNoteUtil, downloadNoteAsPDF as downloadNoteAsPDFUtil } from "@/lib/utils";
import { setScreen } from "@/store/slices/sessionSlice";

export default function NoteComponent() {
  const dispatch = useDispatch();
  const { send } = useWebSocket();
  const debouncedSend = useDebouncedSend(send);

  const session = useSelector((state: RootState) => state.session.session);
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);
  const templates = useSelector((state: RootState) => state.template.templates);
  const visits = useSelector((state: RootState) => state.visit.visits);

  const [transcriptView, setTranscriptView] = useState(false);
  const [isDeletingVisit, setIsDeletingVisit] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isNoteRegenerating, setIsNoteRegenerating] = useState(false);

  useEffect(() => {
    const deleteVisitHandler = handle("delete_visit", "note", (data) => {
      if (data.was_requested) {
        const filteredVisits = visits.filter((visit) => visit.visit_id !== data.data.visit_id);
        dispatch(setVisits(filteredVisits));

        if (filteredVisits.length > 0) {
          const lastVisit = filteredVisits[filteredVisits.length - 1];
          dispatch(setSelectedVisit(lastVisit));

          if (lastVisit.status === "FINISHED" || lastVisit.status === "GENERATING_NOTE") {
            dispatch(setScreen("NOTE"));
          } else {
            dispatch(setScreen("RECORD"));
          }
        }

        setIsDeletingVisit(false);
      } else {
        const filteredVisits = visits.filter((visit) => visit.visit_id !== data.data.visit_id);

        if (filteredVisits.length > 0) {
          const lastVisit = filteredVisits[filteredVisits.length - 1];
          dispatch(setSelectedVisit(lastVisit));

          if (lastVisit.status === "FINISHED" || lastVisit.status === "GENERATING_NOTE") {
            dispatch(setScreen("NOTE"));
          } else {
            dispatch(setScreen("RECORD"));
          }
        }
      }
    });

    return () => {
      deleteVisitHandler();
    };
  }, [visits]);

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
        setIsNoteRegenerating(true);
        regenerateNote();
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

  const regenerateNote = () => {
    setIsNoteRegenerating(true);
    send({
      type: "regenerate_note",
      session_id: session.session_id,
      data: {
        visit_id: selectedVisit?.visit_id,
      },
    });
  };

  const printNote = () => {
    const name = selectedVisit?.name || "New Visit";
    const content = transcriptView ? selectedVisit?.transcript || "" : selectedVisit?.note || "";
    printNoteUtil(name, content);
  };

  const downloadNote = () => {
    const name = selectedVisit?.name || "New Visit";
    const content = transcriptView ? selectedVisit?.transcript || "" : selectedVisit?.note || "";
    downloadNoteAsPDFUtil(name, content);
  };

  const copyAllNote = () => {
    const textToCopy = transcriptView ? selectedVisit?.transcript + "\n\n" + selectedVisit?.additional_context : selectedVisit?.note;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (selectedVisit?.status === "GENERATING_NOTE") {
      setIsNoteRegenerating(false);
    }
  }, [selectedVisit?.status]);

  console.log("Selected visit status", selectedVisit?.status);
  console.log("Note template modified at", selectedVisit?.template_modified_at);
  console.log("Template modified at", templates.find((t) => t.template_id === selectedVisit?.template_id)?.modified_at);

  return (
    <SidebarInset>
      <header className="flex h-14 shrink-0 items-center gap-2">
        <div className="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">{selectedVisit?.name || "New Visit"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center">
              <span className="font-normal text-muted-foreground md:inline-block">
                {selectedVisit?.recording_duration
                  ? `${Math.floor(selectedVisit.recording_duration / 60)
                      .toString()
                      .padStart(2, "0")}:${(selectedVisit.recording_duration % 60).toString().padStart(2, "0")}`
                  : "00:00"}
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
                  <DropdownMenuItem onClick={downloadNote}>
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={regenerateNote}>
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
            <div className="flex items-center gap-2 w-full">
              <Input value={selectedVisit?.name} onChange={nameChange} placeholder="New Visit" className="text-xl md:text-xl font-bold w-full shadow-none border-none outline-none p-0 focus:ring-0 focus:outline-none resize-none overflow-hidden text-left" />
            </div>
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
          </div>

          {selectedVisit?.template_modified_at && selectedVisit?.template_id && templates.find((t) => t.template_id === selectedVisit.template_id)?.modified_at && new Date(selectedVisit.template_modified_at.replace(" ", "T") + "Z") < new Date((templates.find((t) => t.template_id === selectedVisit.template_id)?.modified_at || "").replace(" ", "T") + "Z") && !transcriptView && (
            <div className="flex items-center justify-between p-4 w-full bg-muted rounded-md border-border border">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Template Updated</span>
                <span className="text-sm text-muted-foreground">The template seems to be updated. Please regenerate.</span>
              </div>
              <Button onClick={regenerateNote}>
                {selectedVisit?.status === "GENERATING_NOTE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Regenerate
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
                    <ExpandingTextarea id={`transcript`} minHeight={0} maxHeight={10000} value={selectedVisit?.transcript} disabled={true} className="w-full text-muted-foreground text-sm flex-1 resize-none border-none p-0 leading-relaxed focus:ring-0 focus:outline-none focus:shadow-none placeholder:text-muted-foreground rounded-none" />
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
                <ExpandingTextarea id={`note`} minHeight={0} maxHeight={10000} value={selectedVisit?.note} onChange={noteChange} className="w-full text-muted-foreground text-sm flex-1 resize-none border-none p-0 leading-relaxed focus:ring-0 focus:outline-none focus:shadow-none placeholder:text-muted-foreground rounded-none" />
                {isNoteRegenerating && (
                  <div className="absolute inset-0 bg-background/10 backdrop-blur-[4px] flex items-center justify-center z-10">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
