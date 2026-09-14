import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { storage } from "@/src/utils/storage";

const API_BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;
const ADMIN_KEY = "admin_passcode";

export async function getAdminPasscode(): Promise<string> {
  return (await storage.secureGet<string>(ADMIN_KEY, "")) ?? "";
}

export async function saveAdminPasscode(passcode: string) {
  await storage.secureSet(ADMIN_KEY, passcode);
}

export type SubCategory = { key: string; name_en: string; name_hi: string };
export type Category = {
  id: string;
  order: number;
  name_en: string;
  name_hi: string;
  subCategories: SubCategory[];
};
export type Meta = { categories: Category[]; brandGroups: string[] };

export type CompatGroup = {
  id: string;
  categoryId: string;
  subCategory: string | null;
  brandGroup: string;
  models: string[];
  source: string | null;
  status: "verified" | "unconfirmed";
  confirmCount: number;
  created_at: string;
};

export type Submission = {
  id: string;
  modelName: string;
  category: string | null;
  claimedCompatibleModels: string;
  notes: string | null;
  status: string;
  created_at: string;
};

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function useMeta() {
  return useQuery({
    queryKey: ["meta"],
    queryFn: () => req<Meta>("/meta"),
    staleTime: Infinity,
  });
}

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: () => req<CompatGroup[]>("/groups"),
  });
}

export function useSubmissions() {
  return useQuery({
    queryKey: ["submissions"],
    queryFn: () => req<Submission[]>("/submissions"),
  });
}

export function useConfirmGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      req<CompatGroup>(`/groups/${id}/confirm`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export type CreateGroupInput = {
  categoryId: string;
  subCategory: string | null;
  brandGroup: string;
  models: string[];
  source?: string | null;
  status: "verified" | "unconfirmed";
};

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGroupInput) =>
      req<CompatGroup>("/groups", {
        method: "POST",
        headers: { "X-Admin-Passcode": await getAdminPasscode() },
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useCreateModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; brand: string }) =>
      req("/models", {
        method: "POST",
        headers: { "X-Admin-Passcode": await getAdminPasscode() },
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["models"] }),
  });
}

export type CreateSubmissionInput = {
  modelName: string;
  category?: string | null;
  claimedCompatibleModels: string;
  notes?: string | null;
};

export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubmissionInput) =>
      req<Submission>("/submissions", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["submissions"] }),
  });
}

export async function verifyPasscode(passcode: string): Promise<boolean> {
  const res = await req<{ ok: boolean }>("/admin/verify", {
    method: "POST",
    body: JSON.stringify({ passcode }),
  });
  return res.ok;
}
