"use client";

import React from "react";
import Link from "next/link";
import { Project } from "@/types";
import Avatar from "./Avatar";
import { Users, Clock, ArrowUpRight } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const statusStyles: Record<Project["status"], { label: string; badge: string }> = {
    active: {
      label: "Active",
      badge: "bg-[#E8F2EE] text-[#1F5C4A] border-[#1F5C4A]/20",
    },
    planning: {
      label: "Planning",
      badge: "bg-amber-50 text-[#B9822B] border-amber-200",
    },
    completed: {
      label: "Completed",
      badge: "bg-gray-100 text-[#6C716D] border-gray-200",
    },
    on_hold: {
      label: "On Hold",
      badge: "bg-rose-50 text-[#B94A48] border-rose-200",
    },
  };

  const status = statusStyles[project.status];

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-xl border border-[#E3E5E1] bg-white p-4 transition-all hover:border-[#1F5C4A]/40 hover:shadow-xs active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F2EE] text-[#1F5C4A] font-semibold text-xs border border-[#1F5C4A]/10">
            {project.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#181A19] group-hover:text-[#1F5C4A] transition-colors">
              {project.name}
            </h3>
            <span
              className={`inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium rounded border ${status.badge}`}
            >
              {status.label}
            </span>
          </div>
        </div>

        <ArrowUpRight className="h-4 w-4 text-[#9B9E9C] group-hover:text-[#1F5C4A] transition-colors" />
      </div>

      <p className="mt-2.5 text-xs text-[#6C716D] line-clamp-2 leading-relaxed">
        {project.description}
      </p>

      <div className="mt-3.5 flex items-center justify-between border-t border-[#E3E5E1]/60 pt-2.5 text-xs text-[#6C716D]">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5 overflow-hidden">
            {project.members.slice(0, 3).map((m) => (
              <Avatar
                key={m.id}
                name={m.name}
                size="xs"
                className="ring-2 ring-white"
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-[#181A19]">
            {project.memberCount} members
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-[#9B9E9C]">
          <Clock className="h-3 w-3" strokeWidth={1.75} />
          <span>{project.lastActivity}</span>
        </div>
      </div>
    </Link>
  );
}
