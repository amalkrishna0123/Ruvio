"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Users,
  FileText,
  MapPin,
  Phone,
  Globe,
  GitBranch,
  Shield,
  Activity,
  ChevronRight,
} from "lucide-react";
import { sampleProjects } from "@/lib/mock-data";
import { Avatar, PrimaryButton, SecondaryButton } from "@/components/common";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "prj_mesh_protocol";

  const project =
    sampleProjects.find((p) => p.id === projectId) || sampleProjects[0];

  const quickNav = [
    {
      label: "Project Chat",
      href: `/projects/${project.id}/chat`,
      icon: MessageSquare,
      detail: "Encrypted stream",
    },
    {
      label: "Team Members",
      href: `/projects/${project.id}/members`,
      icon: Users,
      detail: `${project.memberCount} active`,
    },
    {
      label: "Project Files",
      href: `/projects/${project.id}/files`,
      icon: FileText,
      detail: "4 documents",
    },
    {
      label: "Relay Location",
      href: `/location`,
      icon: MapPin,
      detail: "Zurich Datacenter",
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5F5F2]">
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
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6C716D]">
            Workspace Hub
          </span>
        </div>

        <Link
          href={`/call/project-call?name=${encodeURIComponent(project.name)}`}
          className="flex h-9 items-center gap-1 rounded-lg bg-[#E8F2EE] px-3 text-xs font-semibold text-[#1F5C4A] hover:bg-[#D5E8DF] transition-colors"
        >
          <Phone className="h-3.5 w-3.5" />
          <span>Call Room</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Project Hero Card */}
        <div className="rounded-2xl border border-[#E3E5E1] bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center rounded-md bg-[#E8F2EE] px-2 py-0.5 text-[11px] font-semibold text-[#1F5C4A] uppercase tracking-wider">
                {project.status}
              </span>
              <h1 className="mt-2 text-xl font-bold tracking-tight text-[#181A19]">
                {project.name}
              </h1>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1F5C4A] text-white font-semibold text-sm">
              {project.name.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <p className="mt-2.5 text-xs text-[#6C716D] leading-relaxed">
            {project.description}
          </p>

          {/* Links: Repo & Website */}
          <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-[#E3E5E1]/60">
            {project.repoUrl && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#F0F1EE] px-2.5 py-1 text-xs text-[#181A19] font-mono">
                <GitBranch className="h-3 w-3 text-[#6C716D]" />
                {project.repoUrl}
              </span>
            )}
            {project.websiteUrl && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#F0F1EE] px-2.5 py-1 text-xs text-[#181A19]">
                <Globe className="h-3 w-3 text-[#6C716D]" />
                {project.websiteUrl}
              </span>
            )}
          </div>
        </div>

        {/* Quick Nav Links */}
        <div className="space-y-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-[#6C716D]">
            Workspace Channels
          </h2>
          <div className="overflow-hidden rounded-2xl border border-[#E3E5E1] bg-white divide-y divide-[#E3E5E1]/60 shadow-2xs">
            {quickNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-3.5 hover:bg-[#FAFAF8] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F2EE] text-[#1F5C4A]">
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#181A19]">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[#6C716D]">
                        {item.detail}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#9B9E9C]" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Activity Feed Summary */}
        <div className="rounded-2xl border border-[#E3E5E1] bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#181A19] mb-3">
            <Activity className="h-4 w-4 text-[#1F5C4A]" />
            <span>Recent Workspace Activity</span>
          </div>

          <div className="space-y-3 text-xs text-[#6C716D]">
            <div className="flex items-start gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#2F7D5B] mt-1.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-[#181A19]">Elena Rostova</span> uploaded{" "}
                <span className="text-[#1F5C4A] font-medium">cryptographic_audit_v2.4.pdf</span>
                <span className="block text-[10px] text-[#9B9E9C]">18 minutes ago</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#6C716D] mt-1.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-[#181A19]">Julian Hayes</span> verified relay node sync latency.
                <span className="block text-[10px] text-[#9B9E9C]">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
