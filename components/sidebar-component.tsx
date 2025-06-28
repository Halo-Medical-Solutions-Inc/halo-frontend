"use client";

import * as React from "react";
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CirclePlus, MoreHorizontal, StopCircle, Trash2, LogOut, Sparkles, BadgeCheck, ChevronsUpDown, Loader2, MicOff, FileText, Info, MoreHorizontalIcon, Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RootState } from "@/store/store";
import { useSelector, useDispatch } from "react-redux";
import { groupVisitsByDate, formatLocalTime, getUserInitials } from "@/lib/utils";
import { Visit } from "@/store/types";
import { clearSelectedVisit, setSelectedVisit, setVisits } from "@/store/slices/visitSlice";
import { setScreen } from "@/store/slices/sessionSlice";
import useWebSocket, { handle } from "@/lib/websocket";
import { useEffect, useState } from "react";
import { clearSelectedTemplate } from "@/store/slices/templateSlice";
import { clearUser } from "@/store/slices/userSlice";
import { clearSession } from "@/store/slices/sessionSlice";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNextStep } from "nextstepjs";
import { Input } from "@/components/ui/input";

interface SidebarComponentProps {
  loadMoreVisits: () => Promise<void>;
  hasLoadedAll: boolean;
}

export default function SidebarComponent({ loadMoreVisits, hasLoadedAll }: SidebarComponentProps) {
  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const { send } = useWebSocket();
  const { currentTour, setCurrentStep } = useNextStep();

  const session = useSelector((state: RootState) => state.session.session);
  const user = useSelector((state: RootState) => state.user.user);
  const visits = useSelector((state: RootState) => state.visit.visits);
  const groupedVisits = groupVisitsByDate(visits);
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);

  const [isCreatingVisit, setIsCreatingVisit] = useState(false);
  const [isDeletingVisit, setIsDeletingVisit] = useState(false);
  const [isPausingVisit, setIsPausingVisit] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    const createVisitHandler = handle("create_visit", "sidebar", (data) => {
      if (data.was_requested) {
        setIsCreatingVisit(false);
        console.log("Received create_visit in sidebar", currentTour);
        if (currentTour === "visit-tour") {
          setCurrentStep(1, 500);
        }
      }
    });

    const deleteVisitHandler = handle("delete_visit", "sidebar", (data) => {
      if (data.was_requested) {
        console.log("Processing delete_visit in sidebar");
        setIsDeletingVisit(false);
      }
    });

    const pauseRecordingHandler = handle("pause_recording", "sidebar", (data) => {
      if (data.was_requested) {
        setIsPausingVisit(false);
      }
    });

    return () => {
      createVisitHandler();
      deleteVisitHandler();
      pauseRecordingHandler();
    };
  }, [currentTour]);

  const selectVisit = (visit: Visit) => {
    dispatch(setSelectedVisit(visit));
    if (visit.status === "FINISHED" || visit.status === "GENERATING_NOTE") {
      dispatch(setScreen("NOTE"));
    } else {
      dispatch(setScreen("RECORD"));
    }
  };

  const createVisit = () => {
    setIsCreatingVisit(true);
    send({
      type: "create_visit",
      session_id: session.session_id,
      data: {},
    });
  };

  const deleteVisit = (visit: Visit) => {
    setIsDeletingVisit(true);
    send({
      type: "delete_visit",
      session_id: session.session_id,
      data: {
        visit_id: visit.visit_id,
      },
    });
  };

  const pauseRecording = (visit: Visit) => {
    setIsPausingVisit(true);

    send({
      type: "pause_recording",
      session_id: session.session_id,
      data: {
        visit_id: visit.visit_id,
      },
    });
  };

  const templatesClick = () => {
    dispatch(clearSelectedTemplate());
    dispatch(clearSelectedVisit());
    dispatch(setScreen("TEMPLATES"));
  };

  const accountClick = () => {
    dispatch(clearSelectedTemplate());
    dispatch(clearSelectedVisit());
    dispatch(setScreen("ACCOUNT"));
  };

  const logoutClick = () => {
    dispatch(clearSelectedTemplate());
    dispatch(clearSelectedVisit());
    dispatch(clearUser());
    dispatch(clearSession());
    window.location.href = "/signin";
  };

  const handleLoadMore = async () => {
    setIsLoadingAll(true);
    try {
      await loadMoreVisits();
    } finally {
      setIsLoadingAll(false);
    }
  };

  const filteredGroupedVisits = React.useMemo(() => {
    if (!searchTerm.trim()) return groupedVisits;

    return groupedVisits
      .map((group) => ({
        ...group,
        visits: group.visits.filter((visit) => visit.name?.toLowerCase().includes(searchTerm.toLowerCase())),
      }))
      .filter((group) => group.visits.length > 0);
  }, [groupedVisits, searchTerm]);

  const handleSearchClick = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchBlur = () => {
    if (!searchTerm.trim()) {
      setIsSearchExpanded(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleNewVisitClick = () => {
    if (isSearchExpanded) {
      setIsSearchExpanded(false);
    }
    createVisit();
  };

  return (
    <>
      <Sidebar variant="sidebar">
        <SidebarHeader className="pb-0">
          <SidebarMenu>
            <SidebarMenuItem className="cursor-none pointer-events-none">
              <SidebarMenuButton size="lg" asChild>
                <a href="#">
                  <img src="/logo.svg" alt="Halo Logo" className="size-8 rounded-lg" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Scribe</span>
                    <span className="truncate text-xs">Halo Medical Solutions Inc.</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="relative flex w-full min-w-0 flex-row p-2 rounded-md gap-2">
            <div className={`transition-all duration-300 ease-out overflow-hidden ${isSearchExpanded ? 'w-9 flex-shrink-0' : 'flex-1'}`}>
              {isSearchExpanded ? (
                <Button
                  size="icon"
                  className="w-9 h-9 flex-shrink-0 min-w-9"
                  onClick={handleNewVisitClick}
                  disabled={isCreatingVisit}
                  id="visit-tour-new-visit"
                >
                  {isCreatingVisit ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CirclePlus className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <Button
                  className="font-normal w-full h-9 min-h-9"
                  onClick={handleNewVisitClick}
                  disabled={isCreatingVisit}
                  id="visit-tour-new-visit"
                >
                  {isCreatingVisit ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <>
                      <CirclePlus className="h-4 w-4 mr-2" />
                      New Visit
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <div className={`transition-all duration-300 ease-out overflow-hidden ${isSearchExpanded ? 'flex-1' : 'w-9 flex-shrink-0'}`}>
              {isSearchExpanded ? (
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search visits"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onBlur={handleSearchBlur}
                    className="pl-9 h-9 w-full min-h-9"
                    autoFocus
                  />
                </div>
              ) : (
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 flex-shrink-0 min-w-9"
                  onClick={handleSearchClick}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="flex flex-col p-2 pt-0">
            <div className="">
              {filteredGroupedVisits.map(({ date, visits }) => (
                <SidebarGroup key={date} className="group-data-[collapsible=icon]:hidden">
                  <SidebarGroupLabel className="text-muted-foreground font-normal">{date}</SidebarGroupLabel>
                  <SidebarMenu>
                    {visits.map((visit) => (
                      <SidebarMenuItem key={visit.visit_id} className={`group/item ${visit.visit_id === selectedVisit?.visit_id ? "bg-accent" : ""}`} onClick={visit.status !== "RECORDING" ? () => selectVisit(visit) : undefined}>
                        <SidebarMenuButton
                          asChild
                          className={`${
                            visit.status === "RECORDING"
                              ? "cursor-not-allowed bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent"
                              : visit.visit_id === selectedVisit?.visit_id
                              ? "bg-primary/10 hover:bg-primary/10 group-hover/item:bg-primary/10"
                              : "hover:bg-primary/5 group-hover/item:bg-primary/5"
                          }`}
                        >
                          <span className="flex w-full justify-between items-center">
                            <span className="truncate flex-1 min-w-0">{visit.name || "New Visit"}</span>
                            {visit.status !== "RECORDING" && (
                              <span className="text-muted-foreground text-xs font-normal whitespace-nowrap pl-2 flex-shrink-0 transition-all duration-200 group-hover/item:hidden">
                                {visit.created_at ? formatLocalTime(visit.created_at) : "00:00 AM"}
                              </span>
                            )}
                          </span>
                        </SidebarMenuButton>

                        <DropdownMenu key={visit.visit_id}>
                          <DropdownMenuTrigger asChild>
                            {visit.status === "RECORDING" ? (
                              <SidebarMenuAction className="cursor-pointer">
                                <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                              </SidebarMenuAction>
                            ) : (
                              <span className="absolute opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 right-2 top-1/2 -translate-y-1/2 z-10 cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More</span>
                              </span>
                            )}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-auto" side={isMobile ? "bottom" : "right"} align={isMobile ? "end" : "center"}>
                            {visit.status === "RECORDING" ? (
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
                                    <StopCircle className="h-4 w-4 text-destructive" />

                                    <span>Pause Recording</span>
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Pause Recording</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure you want to pause the recording for this visit?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        pauseRecording(visit);
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      disabled={isPausingVisit}
                                    >
                                      {isPausingVisit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pause"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
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
                                        deleteVisit(visit);
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      disabled={isDeletingVisit}
                                    >
                                      {isDeletingVisit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              ))}
              <SidebarGroup>
                <SidebarMenu>
                  {!hasLoadedAll && groupedVisits.length > 0 && (
                    <SidebarMenuItem>
                      <SidebarMenuButton className="bg-transparent hover:bg-transparent text-muted-foreground text-sm" onClick={handleLoadMore} disabled={isLoadingAll}>
                        {isLoadingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontalIcon className="h-4 w-4" />}
                        <span>Load more</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroup>
              {filteredGroupedVisits.length === 0 && <div className="p-4 text-sm text-muted-foreground">{searchTerm ? "No visits found matching your search" : "No visits available"}</div>}
            </div>
          </div>
        </SidebarContent>
        <SidebarFooter>
          {!isMobile && (
            <div className="flex items-center justify-center w-full mt-3 p-3 bg-warning/10 text-warning rounded-md text-sm">
              <Info className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                Find old visits at{" "}
                <a href="https://old.halohealth.app" className="text-warning underline">
                  old.halohealth.app
                </a>
              </span>
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">{getUserInitials(user!)}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user?.name}</span>
                      <span className="truncate text-xs">{user?.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarFallback className="rounded-lg">{getUserInitials(user!)}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{user?.name}</span>
                        <span className="truncate text-xs">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={templatesClick}>
                      <Sparkles />
                      Templates
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={accountClick}>
                      <BadgeCheck />
                      Account
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive hover:text-destructive" onClick={logoutClick}>
                    <LogOut className="text-destructive" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
