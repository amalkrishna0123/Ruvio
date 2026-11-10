"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FolderGit2, Search, Filter } from "lucide-react";
import {
  SearchBar,
  ProjectCard,
  EmptyState,
  BottomNavigation,
} from "@/components/common";
import { useAuth } from "@/lib/firebase/auth-context";
import { subscribeProjects } from "@/lib/firebase/projects-service";
import { Project } from "@/types";

export default function ProjectsPage() {
  const { userProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!userProfile?.id) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeProjects(userProfile.id, (realProjects) => {
      setProjects(realProjects);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.id]);

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E3E5E1] bg-white px-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-[#181A19]">
            Workspaces & Projects
          </h1>
          <span className="text-[11px] text-[#6C716D]">
            {projects.length} active encrypted spaces
          </span>
        </div>

        <Link
          href="/projects/create"
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1F5C4A] px-3 text-xs font-semibold text-white hover:bg-[#164638] active:scale-95 transition-all shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Link>
      </header>

      {/* Search and Filters */}
      <div className="p-3 border-b border-[#E3E5E1]/60 bg-[#FAFAF8] space-y-2.5">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search projects by name or description..."
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {["all", "active", "planning", "completed"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize cursor-pointer transition-colors whitespace-nowrap ${
                statusFilter === tab
                  ? "bg-[#1F5C4A] text-white"
                  : "bg-white text-[#6C716D] border border-[#E3E5E1] hover:bg-[#F0F1EE]"
              }`}
            >
              {tab === "all" ? "All Statuses" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <main className="flex-1 p-3.5 space-y-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-xs text-[#6C716D]">
            Loading workspaces...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FolderGit2 className="w-6 h-6 text-[#1F5C4A]" />}
            title="No projects found"
            description={
              search
                ? `No projects matching "${search}".`
                : "No projects match the selected filter criteria."
            }
            action={
              <Link
                href="/projects/create"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F5C4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#164638]"
              >
                <Plus className="w-3.5 h-3.5" />
                Create New Project
              </Link>
            }
          />
        ) : (
          filtered.map((proj) => <ProjectCard key={proj.id} project={proj} />)
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
