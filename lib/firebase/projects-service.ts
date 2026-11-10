import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "./config";
import { Project, ProjectFile, Message, User } from "@/types";
import { uploadToCloudinary } from "./cloudinary";

/**
 * Subscribes to genuine workspaces/projects for the authenticated user.
 */
export function subscribeProjects(
  userId: string,
  onUpdate: (projects: Project[]) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const projectsRef = collection(db, "projects");
  const q = query(projectsRef, orderBy("lastActivityDate", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const projs: Project[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        projs.push({
          id: docSnap.id,
          name: d.name || "Workspace",
          description: d.description || "",
          status: d.status || "active",
          owner: d.owner || {
            id: userId,
            name: "Owner",
            userNumber: "",
            email: "",
            status: "online",
          },
          memberCount: d.members?.length || 1,
          members: d.members || [],
          lastActivity: d.lastActivity || "Recently",
          websiteUrl: d.websiteUrl,
          repoUrl: d.repoUrl,
          coverGradient: d.coverGradient,
        });
      });
      onUpdate(projs);
    },
    (err) => {
      console.warn("Projects subscription error:", err);
      onUpdate([]);
    }
  );
}

/**
 * Creates a real project in Firestore.
 */
export async function createProjectRecord(
  projectData: Omit<Project, "id" | "memberCount" | "lastActivity">,
  owner: User
): Promise<string> {
  const projectsRef = collection(db, "projects");
  const now = new Date();
  const docRef = await addDoc(projectsRef, {
    name: projectData.name,
    description: projectData.description,
    status: projectData.status,
    owner,
    members: projectData.members?.length ? projectData.members : [owner],
    websiteUrl: projectData.websiteUrl || "",
    repoUrl: projectData.repoUrl || "",
    coverGradient: projectData.coverGradient || "",
    lastActivity: "Just now",
    lastActivityDate: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Subscribes to genuine project files stored in Firestore with Cloudinary references.
 */
export function subscribeProjectFiles(
  projectId: string,
  onUpdate: (files: ProjectFile[]) => void
) {
  if (!projectId) {
    onUpdate([]);
    return () => {};
  }

  const filesRef = collection(db, "projects", projectId, "files");
  const q = query(filesRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const files: ProjectFile[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        files.push({
          id: docSnap.id,
          projectId,
          name: d.name || "file",
          size: d.size || "0 KB",
          category: d.category || "document",
          uploadedBy: d.uploadedBy,
          uploadedAt: d.uploadedAt || "Recently",
        });
      });
      onUpdate(files);
    },
    (err) => {
      console.warn("Project files subscription error:", err);
      onUpdate([]);
    }
  );
}

/**
 * Uploads a file to Cloudinary and saves genuine metadata in Firestore.
 */
export async function uploadProjectFileRecord(
  projectId: string,
  file: File,
  uploader: User
): Promise<ProjectFile> {
  // 1. Secure upload to Cloudinary
  const uploadRes = await uploadToCloudinary(file, `whatsapp/projects/${projectId}`);

  // Format file size
  const bytes = uploadRes.bytes || file.size;
  const sizeStr =
    bytes > 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(bytes / 1024)} KB`;

  // Categorize
  let category: ProjectFile["category"] = "document";
  if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
    category = "media";
  } else if (file.name.match(/\.(ts|js|py|rs|go|json|html|css)$/)) {
    category = "code";
  } else if (file.name.match(/\.(zip|tar|gz|rar|7z)$/)) {
    category = "archive";
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

  const filesRef = collection(db, "projects", projectId, "files");
  const docRef = await addDoc(filesRef, {
    projectId,
    name: file.name,
    size: sizeStr,
    category,
    cloudinaryUrl: uploadRes.url,
    cloudinaryPublicId: uploadRes.publicId,
    uploadedBy: uploader,
    uploadedAt: dateStr,
    createdAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    projectId,
    name: file.name,
    size: sizeStr,
    category,
    uploadedBy: uploader,
    uploadedAt: dateStr,
  };
}

