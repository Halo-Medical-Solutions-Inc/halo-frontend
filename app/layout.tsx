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
        icon: "🎙️",
        title: "Record Your Visit",
        content: "Speak naturally with your patient, then click finish recording when done",
        selector: "#onboarding-natural-finish",
        side: "bottom" as "bottom",
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
