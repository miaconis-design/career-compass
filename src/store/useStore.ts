import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JobStatus = 'Saved' | 'Applied' | 'Interviewing' | 'Ghosted' | 'Rejection' | 'Offer';

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: number;
}

export interface TrackedJob {
  id: string;
  company: string;
  jobTitle: string;
  matchPercentage: number;
  verdict: 'Strong Fit' | 'Stretch' | 'Low Fit';
  sourceUrl?: string;
  status: JobStatus;
  dateAdded: number;
  // Analysis details
  summaryBullets?: string[];
  strengths?: string[];
  stretches?: { gap: string; bridge: string }[];
  applicationAngles?: string[];
  // User notes & files
  notes?: string;
  files?: AttachedFile[];
}

interface AppState {
  apiKey: string;
  setApiKey: (key: string) => void;
  profileText: string;
  setProfileText: (text: string) => void;
  jobs: TrackedJob[];
  addJob: (job: TrackedJob) => void;
  updateJob: (id: string, updates: Partial<TrackedJob>) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  updateJobNotes: (id: string, notes: string) => void;
  addJobFile: (jobId: string, file: AttachedFile) => void;
  deleteJobFile: (jobId: string, fileId: string) => void;
  deleteJob: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      profileText: '',
      setProfileText: (text) => set({ profileText: text }),
      jobs: [],
      addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
      updateJob: (id, updates) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, ...updates } : job
          ),
        })),
      updateJobStatus: (id, status) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, status } : job
          ),
        })),
      updateJobNotes: (id, notes) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, notes } : job
          ),
        })),
      addJobFile: (jobId, file) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === jobId
              ? { ...job, files: [...(job.files || []), file] }
              : job
          ),
        })),
      deleteJobFile: (jobId, fileId) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === jobId
              ? { ...job, files: (job.files || []).filter((f) => f.id !== fileId) }
              : job
          ),
        })),
      deleteJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== id),
        })),
    }),
    {
      name: 'career-compass-storage',
    }
  )
);
