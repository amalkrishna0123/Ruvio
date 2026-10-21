"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Globe,
  GitBranch,
  MapPin,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/common";

export default function CreateProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "planning" | "completed">("active");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [locationName, setLocationName] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setError("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/projects");
    }, 450);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E3E5E1] bg-white px-3">
        <div className="flex items-center gap-2">
          <Link
            href="/projects"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-colors"
            aria-label="Back to projects"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <h1 className="text-base font-semibold tracking-tight text-[#181A19]">
            Create Workspace Project
          </h1>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 p-5 max-w-lg mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <label
              htmlFor="projectName"
              className="block text-xs font-semibold text-[#181A19] mb-1.5"
            >
              Project Name <span className="text-[#B94A48]">*</span>
            </label>
            <input
              id="projectName"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Krypton Relay Network"
              className="h-11 w-full rounded-xl bg-[#F0F1EE] px-3.5 text-sm text-[#181A19] placeholder-[#9B9E9C] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F5C4A] border border-transparent focus:border-[#1F5C4A]"
            />
            {error && <p className="mt-1 text-xs text-[#B94A48]">{error}</p>}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="projectDesc"
              className="block text-xs font-semibold text-[#181A19] mb-1.5"
            >
              Summary & Objectives
            </label>
            <textarea
              id="projectDesc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the work scope, cryptographic keys, and team goals..."
              className="w-full rounded-xl bg-[#F0F1EE] p-3 text-sm text-[#181A19] placeholder-[#9B9E9C] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F5C4A] border border-transparent focus:border-[#1F5C4A] resize-none"
            />
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-semibold text-[#181A19] mb-1.5">
              Initial Phase
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "active", label: "Active" },
                { id: "planning", label: "Planning" },
                { id: "completed", label: "Completed" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-colors cursor-pointer ${
                    status === s.id
                      ? "border-[#1F5C4A] bg-[#E8F2EE] text-[#1F5C4A] font-semibold"
                      : "border-[#E3E5E1] bg-white text-[#6C716D] hover:bg-[#F0F1EE]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progressive Disclosure: Advanced Settings */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#1F5C4A] hover:underline"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showAdvanced ? "rotate-180" : ""
                }`}
              />
              <span>
                {showAdvanced ? "Hide repository & location links" : "Add repository, website, & location links"}
              </span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3.5 rounded-xl border border-[#E3E5E1] bg-[#FAFAF8] p-3.5 animate-slide-up">
                {/* Repository */}
                <div>
                  <label className="block text-xs font-medium text-[#181A19] mb-1 flex items-center gap-1">
                    <GitBranch className="h-3.5 w-3.5 text-[#6C716D]" />
                    Repository URL
                  </label>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="github.com/organization/repo"
                    className="h-10 w-full rounded-lg bg-white px-3 text-xs text-[#181A19] placeholder-[#9B9E9C] border border-[#E3E5E1] focus:outline-none focus:border-[#1F5C4A]"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-xs font-medium text-[#181A19] mb-1 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-[#6C716D]" />
                    Live Deployment URL
                  </label>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://preview.app.internal"
                    className="h-10 w-full rounded-lg bg-white px-3 text-xs text-[#181A19] placeholder-[#9B9E9C] border border-[#E3E5E1] focus:outline-none focus:border-[#1F5C4A]"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-medium text-[#181A19] mb-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#6C716D]" />
                    Physical / Datacenter Node Location
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Zurich Security Bunker #2"
                    className="h-10 w-full rounded-lg bg-white px-3 text-xs text-[#181A19] placeholder-[#9B9E9C] border border-[#E3E5E1] focus:outline-none focus:border-[#1F5C4A]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <PrimaryButton
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full text-sm font-semibold"
            >
              Initialize Workspace
            </PrimaryButton>
          </div>
        </form>
      </main>
    </div>
  );
}
