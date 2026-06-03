"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Thread } from "@/lib/types";

interface ForumState {
  threads: Thread[];
  totalPages: number;
  hasMore: boolean;
  forumName: string;
  fid: number;
  cached: boolean;
  loading: boolean;
  pageLoading: boolean;
  error: string | null;
  activeCategory: string;
  sortBy: "lastReply" | "createTime" | "replyCount";
  sortAsc: boolean;

  setThreads: (threads: Thread[]) => void;
  setTotalPages: (v: number) => void;
  setHasMore: (v: boolean) => void;
  setForumName: (name: string) => void;
  setFid: (fid: number) => void;
  setCached: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  setPageLoading: (v: boolean) => void;
  setError: (err: string | null) => void;
  setActiveCategory: (id: string) => void;
  setSortBy: (sort: ForumState["sortBy"]) => void;
  toggleSortOrder: () => void;
  updateThreadMeta: (updates: Array<{ tid: number; replyCount: number; lastReplyTime: number }>) => void;
  seed: (data: Partial<Pick<ForumState, "threads" | "totalPages" | "hasMore" | "forumName" | "fid" | "cached" | "loading" | "pageLoading">>) => void;
  reset: () => void;
}

export const useForumStore = create<ForumState>()(
  persist(
    (set) => ({
  threads: [],
  totalPages: 1,
  hasMore: false,
  forumName: "",
  fid: 0,
  cached: false,
  loading: true,
  pageLoading: false,
  error: null,
  activeCategory: "all",
  sortBy: "lastReply" as ForumState["sortBy"],
  sortAsc: false,

  setFid: (fid) => set({ fid }),
  setThreads: (threads) => set({ threads }),
  setTotalPages: (total) => set({ totalPages: total }),
  setHasMore: (v) => set({ hasMore: v }),
  setForumName: (name) => set({ forumName: name }),
  setCached: (v) => set({ cached: v }),
  setLoading: (v) => set({ loading: v }),
  setPageLoading: (v) => set({ pageLoading: v }),
  setError: (err) => set({ error: err }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setSortBy: (sort) => set({ sortBy: sort }),
  toggleSortOrder: () => set((s) => ({ sortAsc: !s.sortAsc })),
  updateThreadMeta: (updates) =>
    set((s) => {
      const cur = [...s.threads];
      for (const u of updates) {
        const idx = cur.findIndex((t) => t.tid === u.tid);
        if (idx >= 0) cur[idx] = { ...cur[idx], replyCount: u.replyCount, lastReplyTime: u.lastReplyTime };
      }
      return { threads: cur };
    }),
  seed: (data) => set((s) => ({ ...s, ...data })),
  reset: () =>
    set({
      threads: [],
      totalPages: 1,
      hasMore: false,
      forumName: "",
      fid: 0,
      cached: false,
      loading: true,
      pageLoading: false,
      error: null,
      activeCategory: "all",
      sortBy: "lastReply" as ForumState["sortBy"],
      sortAsc: false,
    }),
}),
    {
      name: "nga-forum-preferences",
      partialize: (state) => ({
        activeCategory: state.activeCategory,
        sortBy: state.sortBy,
        sortAsc: state.sortAsc,
      }),
    }
  )
);
