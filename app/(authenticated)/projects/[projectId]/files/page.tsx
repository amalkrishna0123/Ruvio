"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  Download,
  Search,
} from "lucide-react";
import { sampleFiles, sampleProjects } from "@/lib/mock-data";
import { ProjectFile } from "@/types";
import { SearchBar, EmptyState } from "@/components/common";

export default function ProjectFilesPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "prj_mesh_protocol";
  const project =
    sampleProjects.find((p) => p.id === projectId) || sampleProjects[0];

  const [files, setFiles] = useState<ProjectFile[]>(sampleFiles);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const filtered = files.filter((f) => {
    const matches = f.name.toLowerCase().includes(search.toLowerCase());
    if (!matches) return false;
    if (category !== "all" && f.category !== category) return false;
    return true;
  });

  const getFileIcon = (cat: ProjectFile["category"]) => {
    switch (cat) {
      case "code":
        return <FileCode className="h-5 w-5 text-blue-600" />;
      case "archive":
        return <FileArchive className="h-5 w-5 text-amber-600" />;
      case "media":
        return <ImageIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-[#1F5C4A]" />;
    }
  };

  const handleUploadSim = () => {
    const newF: ProjectFile = {
      id: `file_${Date.now()}`,
      projectId,
      name: "node_health_audit_2026.log",
      size: "312 KB",
      category: "document",
      uploadedBy: project.owner,
      uploadedAt: "Just now",
    };
    setFiles((prev) => [newF, ...prev]);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E3E5E1] bg-white px-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-[#181A19]">
              Workspace Files
            </h1>
            <span className="text-[11px] text-[#6C716D]">
              {files.length} encrypted assets
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUploadSim}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1F5C4A] px-3 text-xs font-semibold text-white hover:bg-[#164638] transition-colors shadow-xs"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload</span>
        </button>
      </header>

      {/* Filter and Search */}
      <div className="p-3 border-b border-[#E3E5E1]/60 bg-[#FAFAF8] space-y-2.5">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search documents and specifications..."
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {["all", "document", "media", "code", "archive"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer whitespace-nowrap ${
                category === cat
                  ? "bg-[#1F5C4A] text-white"
                  : "bg-white text-[#6C716D] border border-[#E3E5E1] hover:bg-[#F0F1EE]"
              }`}
            >
              {cat === "all" ? "All Files" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Files List */}
      <main className="flex-1 divide-y divide-[#E3E5E1]/50 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6 text-[#1F5C4A]" />}
            title="No files found"
            description="No files match your query or category selection."
          />
        ) : (
          filtered.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3.5 hover:bg-[#FAFAF8] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F0F1EE] border border-[#E3E5E1]">
                  {getFileIcon(file.category)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#181A19] truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-[#6C716D] flex items-center gap-1.5 mt-0.5">
                    <span>{file.size}</span>
                    <span>·</span>
                    <span>By {file.uploadedBy.name}</span>
                    <span>·</span>
                    <span>{file.uploadedAt}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => alert(`Downloading encrypted file: ${file.name}`)}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-lg text-[#6C716D] hover:text-[#181A19] hover:bg-[#F0F1EE] transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
