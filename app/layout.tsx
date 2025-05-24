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
    tour: "visit-tour",
    steps: [
      {
        tour: "visit-tour",
        icon: "➕",
        title: "Create New Visit",
        content: "Let's start by creating a new visit",
        selector: "#visit-tour-new-visit",
        side: "right" as "right",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "visit-tour",
        icon: "📝",
        title: "Name the Patient",
        content: "Enter the patient's name",
        selector: "#visit-tour-name-patient",
        side: "bottom" as "bottom",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "visit-tour",
        icon: "📋",
        title: "Select Template",
        content: "Choose a template for the visit",
        selector: "#visit-tour-select-template",
        side: "bottom" as "bottom",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "visit-tour",
        icon: "🎙️",
        title: "Start Recording",
        content: "Click start recording to begin",
        selector: "#visit-tour-start-recording",
        side: "top" as "top",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "visit-tour",
        icon: "🎙️",
        title: "Record Your Visit",
        content: "Speak naturally with your patient, then click finish recording when done",
        selector: "#visit-tour-natural-finish",
        side: "bottom" as "bottom",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
    ],
  },
  {
    tour: "template-tour",
    steps: [
      {
        tour: "template-tour",
        icon: "✨",
        title: "Create New Template",
        content: "Click to create a new template",
        selector: "#template-tour-create-new",
        side: "bottom" as "bottom",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "template-tour",
        icon: "📝",
        title: "Copy Existing Note",
        content: "Paste an existing note in this text area",
        selector: "#template-tour-content-textarea",
        side: "left" as "left",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "template-tour",
        icon: "✨",
        title: "Polish Your Template",
        content: "Click the Polish button to enhance your template",
        selector: "#template-tour-polish-button",
        side: "bottom" as "bottom",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "template-tour",
        icon: "🎙️",
        title: "How to read your template",
        content: "Click the instructions button to read how to use your template",
        selector: "#template-tour-content-textarea",
        side: "left" as "left",
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
