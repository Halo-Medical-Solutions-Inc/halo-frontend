import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Printer,
  Download,
  RefreshCw,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { ExpandingTextarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export default function NoteComponent() {
  const selectedVisit = useSelector(
    (state: RootState) => state.visit.selectedVisit,
  );
  const templates = useSelector((state: RootState) => state.template.templates);

  const noteSections = [
    {
      title: "SUBJECTIVE",
      body: "Patient is a 42-year-old male presenting with occasional headaches and mild insomnia for the past two weeks. Reports no other symptoms. No history of migraines.",
    },
    {
      title: "OBJECTIVE",
      body: "Vital signs within normal range. BP: 120/80, HR: 72, Temp: 98.6°F. HEENT exam normal. No focal neurological deficits.",
    },
    {
      title: "ASSESSMENT",
      body: "1. Tension headaches, likely stress-related\n2. Insomnia, mild\n3. Hypertension, well-controlled",
    },
    {
      title: "PLAN",
      body: "1. OTC analgesics for headaches as needed\n2. Sleep hygiene counseling provided\n3. Continue current BP medication\n4. Follow up in 3 months or sooner if symptoms worsen",
    },
  ];

  const transcriptView = false;
  const displaySections = !transcriptView ? noteSections : [];

  const [name, setName] = useState(selectedVisit?.name);
  const [template, setTemplate] = useState(selectedVisit?.template_id);
  const [note, setNote] = useState(noteSections);

  return (
    <SidebarInset>
      <header className="flex h-14 shrink-0 items-center gap-2">
        <div className="flex flex-1 items-center gap-2 px-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">
                  {selectedVisit?.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto px-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center">
              <span className="font-normal text-muted-foreground md:inline-block">
                {Math.floor(selectedVisit?.recording_duration || 0 / 60)} minutes
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-1">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-auto" align="end">
                  <DropdownMenuItem>
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <RefreshCw className="h-4 w-4" />
                    <span>Regenerate</span>
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive hover:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span>Delete Visit</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the visit. This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
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
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New Visit"
                className="text-xl md:text-xl font-bold w-full shadow-none border-none outline-none p-0 focus:ring-0 focus:outline-none resize-none overflow-hidden text-left"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={template}
                onValueChange={(value) => setTemplate(value)}
              >
                <SelectTrigger className="min-w-[50px] max-w-[240px] w-auto">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectGroup>
                    <SelectLabel>Templates</SelectLabel>
                    <SelectItem value="transcript">Transcript</SelectItem>
                    {templates.map((template) => (
                      <SelectItem 
                        key={template._id} 
                        value={template._id || ""}
                      >
                        {template.name || "Unnamed Template"}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button>
                <Copy className="h-4 w-4" />
                Copy all
              </Button>
            </div>
          </div>

          {selectedVisit?.template_modified_at &&
            templates.find((t) => t._id === selectedVisit?.template_id)
              ?.modified_at &&
            new Date(selectedVisit?.template_modified_at) <
              new Date(
                templates.find((t) => t._id === selectedVisit?.template_id)
                  ?.modified_at || "",
              ) &&
            transcriptView && (
              <div className="flex items-center justify-between p-4 w-full bg-muted rounded-md border-border border">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Template Updated</span>
                  <span className="text-sm text-muted-foreground">
                    The template seems to be updated. Please regenerate.
                  </span>
                </div>
                <Button>
                  <RefreshCw className="h-4 w-4" />
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm font-bold text-primary truncate cursor-pointer hover:text-primary/80">
                            TRANSCRIPT
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="flex items-center gap-1"
                        >
                          Click to copy
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="relative group mt-2">
                    <ExpandingTextarea
                      id={`transcript`}
                      minHeight={0}
                      maxHeight={10000}
                      value={selectedVisit?.transcript}
                      disabled={true}
                      className="w-full text-muted-foreground text-sm flex-1 resize-none border-none p-0 leading-relaxed focus:ring-0 focus:outline-none focus:shadow-none placeholder:text-muted-foreground rounded-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="w-full flex items-center relative group">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm font-bold text-primary truncate cursor-pointer hover:text-primary/80">
                            ADDITIONAL CONTEXT
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="flex items-center gap-1"
                        >
                          Click to copy
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="relative group mt-2">
                    <ExpandingTextarea
                      id={`additional-context`}
                      minHeight={0}
                      maxHeight={10000}
                      value={selectedVisit?.additional_context}
                      disabled={true}
                      className="w-full text-muted-foreground text-sm flex-1 resize-none border-none p-0 leading-relaxed focus:ring-0 focus:outline-none focus:shadow-none placeholder:text-muted-foreground rounded-none"
                    />
                  </div>
                </div>
              </>
            ) : (
              // Note sections
              displaySections.map((section, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="w-full flex items-center relative group">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm font-bold text-primary truncate cursor-pointer hover:text-primary/80">
                            {section.title}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="flex items-center gap-1"
                        >
                          Click to copy
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="relative group mt-2">
                    <ExpandingTextarea
                      id={`${index}`}
                      minHeight={0}
                      maxHeight={10000}
                      value={note[index].body}
                      onChange={(e) =>
                        setNote(
                          note.map((s, i) =>
                            i === index ? { ...s, body: e.target.value } : s,
                          ),
                        )
                      }
                      className="w-full text-muted-foreground text-sm flex-1 resize-none border-none p-0 leading-relaxed focus:ring-0 focus:outline-none focus:shadow-none placeholder:text-muted-foreground rounded-none"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}
