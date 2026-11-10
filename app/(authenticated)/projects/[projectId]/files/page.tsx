"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { ProjectFile } from "@/types";
import { SearchBar, EmptyState } from "@/components/common";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  subscribeProjectFiles,
  uploadProjectFileRecord,
} from "@/lib/firebase/projects-service";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function ProjectFilesPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "";
  const { userProfile } = useAuth();

  const [projectName, setProjectName] = useState("Workspace");
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch project title
  useEffect(() => {
    if (!projectId) return;
    getDoc(doc(db, "projects", projectId)).then((snap) => {
      if (snap.exists()) {
        setProjectName(snap.data().name || "Workspace");
      }
    });
  }, [projectId]);

  // 2. Subscribe to genuine files
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeProjectFiles(projectId, (realFiles) => {
      setFiles(realFiles);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !userProfile || !projectId) return;

    const fileList = Array.from(selectedFiles);
    setIsUploading(true);

    try {
      await Promise.all(
        fileList.map((file) => uploadProjectFileRecord(projectId, file, userProfile))
      );
    } catch (err: any) {
      alert(`Upload failed: ${err?.message || err}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Hidden file input for genuine Cloudinary uploads (supports multiple files) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E3E5E1] bg-white px-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${projectId}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#181A19] hover:bg-[#F0F1EE] active:scale-95 transition-colors"
            aria-label="Back to project"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-[#181A19]">
              Workspace Files
            </h1>
            <span className="text-[11px] text-[#6C716D]">
              {projectName} · Cloudinary encrypted
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1F5C4A] px-3 text-xs font-semibold text-white hover:bg-[#164638] active:scale-95 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>{isUploading ? "Uploading..." : "Upload File"}</span>
        </button>
      </header>

      {/* Search and Category Tabs */}
      <div className="p-3 border-b border-[#E3E5E1]/60 bg-[#FAFAF8] space-y-2.5">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search files by name..."
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {["all", "document", "media", "code", "archive"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize cursor-pointer transition-colors whitespace-nowrap ${
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
      <main className="flex-1 divide-y divide-[#E3E5E1]/60 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-xs text-[#6C716D]">
            Loading workspace files...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6 text-[#1F5C4A]" />}
            title="No files found"
            description={
              search
                ? `No documents matching "${search}".`
                : "No files uploaded to this workspace yet."
            }
            action={
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F5C4A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#164638]"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload First File
              </button>
            }
          />
        ) : (
          filtered.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3.5 hover:bg-[#FAFAF8] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F0F1EE]">
                  {getFileIcon(file.category)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#181A19] truncate font-mono">
                    {file.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#6C716D] mt-0.5">
                    <span>{file.size}</span>
                    <span>·</span>
                    <span>{file.uploadedAt}</span>
                    <span>·</span>
                    <span className="truncate">by {file.uploadedBy?.name || "Member"}</span>
                  </div>
                </div>
              </div>

              <a
                href={(file as any).cloudinaryUrl || "#"}
                target="_blank"
                rel="noreferrer"
                download
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[#6C716D] hover:bg-[#F0F1EE] hover:text-[#181A19] transition-colors"
                title="Download genuine file"
              >
                <Download className="h-4.5 w-4.5" />
              </a>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
