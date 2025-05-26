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
        title: "Start a New Visit",
        content: "Click **New Visit** to begin documenting the encounter",
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
        title: "Label the Encounter",
        content: "To continue this walkthrough, type **--Alex Patient--** exactly.\nIn real use, you can use any naming style — //full names//, //initials//, or //shorthand//.",
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
        title: "Select a Template",
        content: "For this walkthrough, choose **H&P** from the list.\nIn real visits, feel free to use SOAP or any custom template that fits your workflow.",
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
        content: "Click **Start Recording** to begin capturing the encounter",
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
        content: "Read the sample dialogue below to simulate a patient encounter:\n\n**Doctor:** //Hi Alex, what brings you in today?//\n**Patient:** //I've had a sore throat, some chills, and a mild fever for the past two days.//\n**Doctor:** //Any trouble swallowing or coughing?//\n**Patient:** //A bit of both. It hurts more on the right side.//\n**Doctor:** //Have you had anything like this before?//\n**Patient:** //No, this is the first time it's been this bad.//\n**Doctor:** //Alright, I'll take a look and check your temperature. We'll get you taken care of.//\n\nWhen you're finished, click **Finish** to generate your note.",
        selector: "#visit-tour-natural-finish",
        side: "left" as "left",
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
        title: "Create a New Template",
        content: "Click **Create** to start building a custom note format from scratch",
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
        title: "Copy or Describe Your Template",
        content: 'Paste an existing note here — or describe what you want, like:\n\n//"Referral letter template for cardiology"//\n//"Create an H&P format with CC, HPI, ROS, and A/P."//\nHALO will generate a structured template from your input. \n\nWhen done pasting or writing instructions, write **FINISHED**',
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
        content: "Click **Polish** to turn your example or prompt into a structured, editable template",
        selector: "#template-tour-polish-button",
        side: "bottom" as "bottom",
        showControls: true,
        showSkip: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        tour: "template-tour",
        icon: "✅",
        title: "Your Template is Ready",
        content: "You can now fine-tune the template by editing any section directly.\n\n//Text in curly brackets {} acts as an instruction to HALO — it won't appear in the final note, but it helps guide the AI's output.//",
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
