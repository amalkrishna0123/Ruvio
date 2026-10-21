"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Shield, MoreVertical, Trash2 } from "lucide-react";
import { sampleProjects, sampleUsers, currentUser } from "@/lib/mock-data";
import { Avatar, PrimaryButton } from "@/components/common";

export default function ProjectMembersPage() {
  const params = useParams();
  const projectId = (params?.projectId as string) || "prj_mesh_protocol";
  const project =
    sampleProjects.find((p) => p.id === projectId) || sampleProjects[0];

  const [members, setMembers] = useState([
    { ...currentUser, role: "Owner" },
    { ...sampleUsers[0], role: "Admin" },
    { ...sampleUsers[1], role: "Member" },
    { ...sampleUsers[2], role: "Member" },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserNumber, setNewUserNumber] = useState("");

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = sampleUsers.find((u) => u.userNumber === newUserNumber);
    if (candidate) {
      setMembers((prev) => [...prev, { ...candidate, role: "Member" }]);
      setShowAddModal(false);
      setNewUserNumber("");
    } else {
      alert("No user found with this number.");
    }
  };

  const handleRemove = (id: string, name: string) => {
    if (confirm(`Remove ${name} from ${project.name}?`)) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }
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
              Workspace Roster
            </h1>
            <span className="text-[11px] text-[#6C716D]">
              {members.length} contributors
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex h-9 items-center gap-1 rounded-lg bg-[#E8F2EE] px-3 text-xs font-semibold text-[#1F5C4A] hover:bg-[#D5E8DF] transition-colors"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Add</span>
        </button>
      </header>

      {/* Members list */}
      <main className="flex-1 divide-y divide-[#E3E5E1]/60 overflow-y-auto">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3.5 hover:bg-[#FAFAF8] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar
                name={member.name}
                userNumber={member.userNumber}
                status={member.status}
                size="md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#181A19]">
                    {member.name}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] font-semibold uppercase ${
                      member.role === "Owner"
                        ? "bg-[#1F5C4A] text-white"
                        : member.role === "Admin"
                        ? "bg-[#E8F2EE] text-[#1F5C4A]"
                        : "bg-[#F0F1EE] text-[#6C716D]"
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
                <div className="text-xs text-[#6C716D]">
                  #{member.userNumber} · {member.email}
                </div>
              </div>
            </div>

            {member.role !== "Owner" && (
              <button
                type="button"
                onClick={() => handleRemove(member.id, member.name)}
                className="p-1.5 text-[#9B9E9C] hover:text-[#B94A48] hover:bg-[#FBEAEA] rounded-lg transition-colors"
                title="Remove Member"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </main>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl animate-slide-up">
            <h3 className="text-base font-bold text-[#181A19]">
              Grant Workspace Access
            </h3>
            <p className="mt-1 text-xs text-[#6C716D]">
              Enter the 6-digit User Number of the collaborator to share encrypted access keys.
            </p>

            <form onSubmit={handleAddMember} className="mt-4 space-y-3">
              <input
                type="text"
                maxLength={6}
                value={newUserNumber}
                onChange={(e) => setNewUserNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 362174"
                className="h-11 w-full rounded-xl bg-[#F0F1EE] px-3.5 font-mono text-sm text-[#181A19] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1F5C4A] border border-[#E3E5E1]"
              />

              <div className="flex gap-2 pt-2">
                <PrimaryButton type="submit" className="flex-1 text-xs">
                  Grant Access
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-[#E3E5E1] px-4 py-2 text-xs font-semibold text-[#6C716D] hover:bg-[#F0F1EE]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
