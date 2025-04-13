"use client";

import * as React from "react";
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CirclePlus, MoreHorizontal, StopCircle, Trash2, LogOut, Sparkles, BadgeCheck, ChevronsUpDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RootState } from "@/store/store";
import { useSelector, useDispatch } from "react-redux";
import { groupVisitsByDate } from "@/lib/utils";
import { Visit } from "@/store/types";
import { setSelectedVisit } from "@/store/slices/visitSlice";
import { setScreen } from "@/store/slices/sessionSlice";

export default function SidebarComponent() {
  const dispatch = useDispatch();
  const isMobile = false;

  const user = useSelector((state: RootState) => state.user.user);
  const visits = useSelector((state: RootState) => state.visit.visits);
  const groupedVisits = groupVisitsByDate(visits);
  const selectedVisit = useSelector((state: RootState) => state.visit.selectedVisit);

  const selectVisit = (visit: Visit) => {
    dispatch(setSelectedVisit(visit));
    if (visit.status === "FINISHED") {
      dispatch(setScreen("NOTE"));
    } else {
      dispatch(setScreen("RECORD"));
    }
  };

  const createVisit = () => {
    // TODO: Implement create visit
  };

  const deleteVisit = (visit: Visit) => {
    // TODO: Implement delete visit
  };

  const pauseVisit = (visit: Visit) => {
    // TODO: Implement pause visit
  };

  return (
    <>
      <Sidebar variant="sidebar">
        <SidebarHeader className="pb-0">
          <SidebarMenu>
            <SidebarMenuItem>
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
          <div className="relative flex w-full min-w-0 flex-col p-2 rounded-md">
            <Button className="font-normal">
              <CirclePlus className="h-4 w-4" />
              New Visit
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="flex flex-col p-2">
            <div className="">
              {groupedVisits.map(({ date, visits }) => (
                <SidebarGroup key={date} className="group-data-[collapsible=icon]:hidden">
                  <SidebarGroupLabel className="text-muted-foreground font-normal">{date}</SidebarGroupLabel>
                  <SidebarMenu>
                    {visits.map((visit) => (
                      <SidebarMenuItem key={visit._id} className={visit._id === selectedVisit?._id ? "bg-accent" : ""} onClick={visit.status !== "RECORDING" ? () => selectVisit(visit) : undefined}>
                        <SidebarMenuButton asChild className={`${visit.status === "RECORDING" ? "cursor-not-allowed bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent" : visit._id === selectedVisit?._id ? "bg-primary/10 hover:bg-primary/10" : "hover:bg-primary/5"}`}>
                          <span className="flex w-full justify-between items-center">
                            <span className="truncate">{visit.name || "New Visit"}</span>
                            <span className="text-muted-foreground ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-normal outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0">
                              {visit.created_at ? new Date(visit.created_at).getHours() : 0}:{String(visit.created_at ? new Date(visit.created_at).getMinutes() : 0).padStart(2, "0")} {visit.created_at && new Date(visit.created_at).getHours() >= 12 ? "PM" : "AM"}
                            </span>
                          </span>
                        </SidebarMenuButton>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            {visit.status === "RECORDING" ? (
                              <SidebarMenuAction>
                                <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                              </SidebarMenuAction>
                            ) : (
                              <SidebarMenuAction showOnHover>
                                <MoreHorizontal />
                                <span className="sr-only">More</span>
                              </SidebarMenuAction>
                            )}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-auto" side={isMobile ? "bottom" : "right"} align={isMobile ? "end" : "center"}>
                            {visit.status === "RECORDING" ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive hover:text-destructive" onSelect={(e) => e.preventDefault()}>
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
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Pause</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive hover:text-destructive" onSelect={(e) => e.preventDefault()}>
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
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
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
              {groupedVisits.length === 0 && <div className="p-4 text-sm text-muted-foreground">No visits available</div>}
            </div>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
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
                        <AvatarFallback className="rounded-lg">{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{user?.name}</span>
                        <span className="truncate text-xs">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => dispatch(setScreen("TEMPLATES"))}>
                      <Sparkles />
                      Templates
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => dispatch(setScreen("ACCOUNT"))}>
                      <BadgeCheck />
                      Account
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive hover:text-destructive">
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
