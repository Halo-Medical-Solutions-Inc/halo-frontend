"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from "react-redux";
import { store, persistor } from "@/store/store";
import { PersistGate } from "redux-persist/integration/react";
import { NextStepProvider, NextStep } from "nextstepjs";
import CustomCard from "@/components/ui/custom-card";

const steps = [
  {
    tour: "mainTour",
    steps: [
      {
        tour: "mainTour",
        icon: "👋",
        title: "Header",
        content: "Read this",
        selector: "#tour-header",
        side: "bottom" as "bottom",
        showControls: true,
        showSkip: true,
      },
      {
        tour: "mainTour",
        icon: "📝",
        title: "Body",
        content: "Read this",
        selector: "#tour-body",
        side: "right" as "right",
        showControls: true,
        showSkip: true,
      },
      {
        tour: "mainTour",
        icon: "✅",
        title: "Finish",
        content: "Read this",
        selector: "#tour-finish",
        side: "top" as "top",
        showControls: true,
        showSkip: true,
      },
    ],
  },
  {
    tour: "onboarding",
    steps: [
      {
        tour: "onboarding",
        icon: "➕",
        title: "Create New Visit",
        content: "Let's start by creating a new visit",
        selector: "#onboarding-new-visit",
        side: "right" as "right",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "onboarding",
        icon: "📝",
        title: "Name the Patient",
        content: "Enter the patient's name",
        selector: "#onboarding-name-patient",
        side: "bottom" as "bottom",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "onboarding",
        icon: "📋",
        title: "Select Template",
        content: "Choose a template for the visit",
        selector: "#onboarding-select-template",
        side: "bottom" as "bottom",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "onboarding",
        icon: "🎙️",
        title: "Start Recording",
        content: "Click start recording to begin",
        selector: "#onboarding-start-recording",
        side: "top" as "top",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "onboarding",
        icon: "🗣️",
        title: "Speak Naturally",
        content: "Just talk normally like you would with your patient",
        selector: "#onboarding-speak-naturally",
        side: "bottom" as "bottom",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "onboarding",
        icon: "✅",
        title: "Finish Recording",
        content: "Click finish recording when done",
        selector: "#onboarding-finish-recording",
        side: "top" as "top",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
    ],
  },
];

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <NextStepProvider>
              <NextStep steps={steps} cardComponent={CustomCard}>
                {children}
              </NextStep>
            </NextStepProvider>
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}
