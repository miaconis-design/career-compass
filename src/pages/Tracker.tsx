import { useState, useRef } from 'react';
import { useStore, JobStatus, TrackedJob, AttachedFile } from '../store/useStore';
import { 
  ExternalLink, Trash2, Calendar, FileText, Paperclip, 
  Download, X, CheckCircle2, AlertCircle, Sparkles, 
  ArrowRight, Upload, ChevronDown, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLUMNS: { id: JobStatus; label: string }[] = [
  { id: 'Saved', label: 'Saved Jobs' },
  { id: 'Applied', label: 'Applied' },
  { id: 'Interviewing', label: 'Interviewing' },
  { id: 'Ghosted', label: 'Ghosted' },
  { id: 'Rejection', label: 'Rejection' },
  { id: 'Offer', label: 'Offer' },
];

export default function Tracker() {
  const { jobs, updateJobStatus, deleteJob, updateJobNotes, addJobFile, deleteJobFile } = useStore();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || null;

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData('jobId', jobId);
  };

  const handleDrop = (e: React.DragEvent, status: JobStatus) => {
    const jobId = e.dataTransfer.getData('jobId');
    if (jobId) {
      updateJobStatus(jobId, status);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Application Tracker</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 leading-relaxed">
            Click any card to view the full analysis, update notes, or manage application files.
          </p>
        </div>
        <div className="self-start sm:self-auto shrink-0">
          <span className="inline-flex items-center text-xs font-semibold text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200/80 shadow-2xs whitespace-nowrap">
            {jobs.length} Total {jobs.length === 1 ? 'Job' : 'Jobs'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-6">
        <div className="flex gap-6 min-w-max h-full">
          {COLUMNS.map((column) => {
            const columnJobs = jobs.filter((j) => j.status === column.id);
            return (
              <div
                key={column.id}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragOver={handleDragOver}
                className="w-84 flex flex-col bg-gray-100/60 rounded-3xl p-4 border border-gray-200/60"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="font-bold text-gray-800 text-sm tracking-tight">{column.label}</h2>
                  <span className="text-xs font-semibold bg-white text-gray-600 px-2.5 py-0.5 rounded-full border border-gray-200/60 shadow-xs">
                    {columnJobs.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
                  <AnimatePresence>
                    {columnJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onDragStart={handleDragStart}
                        onSelect={() => setSelectedJobId(job.id)}
                        onDelete={deleteJob}
                        onStatusChange={(status) => updateJobStatus(job.id, status)}
                      />
                    ))}
                  </AnimatePresence>
                  {columnJobs.length === 0 && (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200/80 rounded-2xl text-xs text-gray-400 font-medium">
                      Drop cards here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <JobDetailModal
            job={selectedJob}
            onClose={() => setSelectedJobId(null)}
            onDelete={(id) => {
              deleteJob(id);
              setSelectedJobId(null);
            }}
            onUpdateStatus={(status) => updateJobStatus(selectedJob.id, status)}
            onSaveNotes={(notes) => updateJobNotes(selectedJob.id, notes)}
            onAddFile={(file) => addJobFile(selectedJob.id, file)}
            onDeleteFile={(fileId) => deleteJobFile(selectedJob.id, fileId)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function JobCard({
  job,
  onDragStart,
  onSelect,
  onDelete,
  onStatusChange,
}: {
  job: TrackedJob;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onSelect: () => void;
  onDelete: (id: string) => void;
  onStatusChange: (status: JobStatus) => void;
}) {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Strong Fit':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Stretch':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const hasNotes = Boolean(job.notes?.trim());
  const filesCount = job.files?.length || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, job.id)}
      onClick={onSelect}
      className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200/80 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      <div className="flex justify-between items-start mb-1.5">
        <h3 className="font-bold text-gray-900 leading-snug text-sm pr-2 group-hover:text-indigo-600 transition-colors">
          {job.jobTitle}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(job.id);
          }}
          className="text-gray-300 hover:text-red-500 transition-colors p-1 -mr-1 -mt-1 opacity-0 group-hover:opacity-100"
          title="Delete application"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs font-medium text-gray-500 mb-3">{job.company}</p>

      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getVerdictColor(
            job.verdict
          )}`}
        >
          {job.matchPercentage}% • {job.verdict}
        </span>

        {job.sourceUrl && (
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
            title="Open original job posting"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Badges for notes & attached files */}
      {(hasNotes || filesCount > 0) && (
        <div className="flex items-center gap-2 mb-3 pt-1 border-t border-gray-50 text-[11px] text-gray-500">
          {hasNotes && (
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 font-medium text-indigo-700">
              <FileText className="w-3 h-3" /> Note
            </span>
          )}
          {filesCount > 0 && (
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 font-medium text-violet-700">
              <Paperclip className="w-3 h-3" /> {filesCount} {filesCount === 1 ? 'file' : 'files'}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-[11px] text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(job.dateAdded).toLocaleDateString()}
        </div>

        {/* Quick status selector */}
        <select
          value={job.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(e.target.value as JobStatus);
          }}
          className="text-[10px] font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md px-1.5 py-0.5 border border-gray-200 cursor-pointer focus:outline-none"
        >
          {COLUMNS.map((col) => (
            <option key={col.id} value={col.id}>
              {col.label}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  );
}

function JobDetailModal({
  job,
  onClose,
  onDelete,
  onUpdateStatus,
  onSaveNotes,
  onAddFile,
  onDeleteFile,
}: {
  job: TrackedJob;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (status: JobStatus) => void;
  onSaveNotes: (notes: string) => void;
  onAddFile: (file: AttachedFile) => void;
  onDeleteFile: (fileId: string) => void;
}) {
  const [notes, setNotes] = useState(job.notes || '');
  const [savedNote, setSavedNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleSaveNoteClick = () => {
    onSaveNotes(notes);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onAddFile({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl,
        uploadedAt: Date.now(),
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadFile = (file: AttachedFile) => {
    const a = document.createElement('a');
    a.href = file.dataUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'Strong Fit':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Stretch':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-rose-700 bg-rose-50 border-rose-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-white flex items-start justify-between">
          <div className="space-y-1.5 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                {job.company}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${getVerdictStyle(
                  job.verdict
                )}`}
              >
                {job.matchPercentage}% • {job.verdict}
              </span>
              {job.sourceUrl && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-2.5 py-1 rounded-full"
                >
                  Source Posting <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{job.jobTitle}</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={job.status}
                onChange={(e) => onUpdateStatus(e.target.value as JobStatus)}
                className="appearance-none text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200/70 rounded-full pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none transition-colors"
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => onDelete(job.id)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
              title="Delete application"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {/* 1. Notes & Follow-up Section */}
          <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Application Notes & Progress
              </h3>
              <button
                onClick={handleSaveNoteClick}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs"
              >
                {savedNote ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Note
                  </>
                )}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              onBlur={() => onSaveNotes(notes)}
              placeholder="Jot down notes about this application: recruiter contact details, interview stages, follow-up dates, answers to screen questions, or salary discussions..."
              className="w-full h-24 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm leading-relaxed resize-none"
            />
          </div>

          {/* 2. Attached Files Section (Save & Download only, no preview) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-violet-600" />
                  Attached Application Files
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Save your customized cover letter, application questions (.txt), or tailored resume
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg border border-violet-200 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Add File
                </button>
              </div>
            </div>

            {job.files && job.files.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {job.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 shadow-xs hover:border-violet-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteFile(file.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center cursor-pointer hover:border-violet-300 hover:bg-violet-50/20 transition-colors"
              >
                <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                <p className="text-xs font-medium text-gray-600">
                  No files attached yet. Click to upload your cover letter, answer notes, or resume.
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Supports .txt, .pdf, .docx, .doc, images</p>
              </div>
            )}
          </div>

          {/* 3. AI Fit Analysis Breakdown */}
          {job.summaryBullets || job.strengths || job.stretches || job.applicationAngles ? (
            <div className="space-y-6 pt-4 border-t border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Original Evaluation Breakdown
              </h3>

              {/* Role Snapshot */}
              {job.summaryBullets && job.summaryBullets.length > 0 && (
                <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2.5">
                    Role Snapshot
                  </h4>
                  <ul className="space-y-1.5">
                    {job.summaryBullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-indigo-900/80 leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths & Stretches Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Strengths */}
                {job.strengths && job.strengths.length > 0 && (
                  <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-xs">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-800 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Key Strengths ({job.strengths.length})
                    </h4>
                    <ul className="space-y-2">
                      {job.strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Stretches */}
                {job.stretches && job.stretches.length > 0 && (
                  <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-xs">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-amber-800 mb-3">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      Stretches & Gaps ({job.stretches.length})
                    </h4>
                    <ul className="space-y-3">
                      {job.stretches.map((stretch, i) => (
                        <li key={i} className="text-xs space-y-1">
                          <p className="font-semibold text-gray-900">{stretch.gap}</p>
                          <p className="text-amber-800/90 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-100/60 text-[11px] leading-relaxed">
                            💡 {stretch.bridge}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Application Focus */}
              {job.applicationAngles && job.applicationAngles.length > 0 && (
                <div className="bg-gradient-to-br from-violet-50/60 to-indigo-50/60 border border-indigo-100/80 rounded-2xl p-5">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900 mb-3">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    Application Focus & Angles ({job.applicationAngles.length})
                  </h4>
                  <ul className="space-y-2">
                    {job.applicationAngles.map((angle, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-indigo-900/90 leading-relaxed font-medium">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                        <span>{angle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-2xl text-xs text-gray-500 text-center border border-gray-100">
              No detailed AI evaluation recorded for this application.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
