import { useEffect, useRef, useState, type FormEvent } from "react";
import { downloadMyResume, getMyProfile, updateMyProfile, uploadResume } from "../../api/candidates";
import { getErrorMessage } from "../../api/client";
import { Button } from "../../components/Button";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormField } from "../../components/FormField";
import { ArrowUpTrayIcon, DocumentIcon } from "../../components/icons";
import { Layout } from "../../components/Layout";
import { ResumeViewerDialog } from "../../components/ResumeViewerDialog";
import { Spinner } from "../../components/Spinner";
import type { CandidateProfile } from "../../types";

export function CandidateProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [headline, setHeadline] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isResumeViewerOpen, setIsResumeViewerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setProfile(data);
        setHeadline(data.headline ?? "");
        setPhone(data.phone ?? "");
        setLocation(data.location ?? "");
        setExperienceYears(data.experience_years != null ? String(data.experience_years) : "");
        setSkillsInput(data.skills.join(", "));
        setExpectedSalary(data.expected_salary != null ? String(data.expected_salary) : "");
      })
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      const updated = await updateMyProfile({
        headline: headline.trim() || null,
        phone: phone.trim() || null,
        location: location.trim() || null,
        experience_years: experienceYears.trim() ? Number(experienceYears) : null,
        skills: skillsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        expected_salary: expectedSalary.trim() ? Number(expectedSalary) : null,
      });
      setProfile(updated);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResumeSelected() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setResumeError(null);
    setIsUploadingResume(true);
    try {
      const updated = await uploadResume(file);
      setProfile(updated);
    } catch (err) {
      setResumeError(getErrorMessage(err));
    } finally {
      setIsUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Profile</h1>
      <p className="mt-1 text-sm text-slate-500">Keep your details current so HR can find and reach you.</p>
      <div className="mt-6">
        <ErrorBanner message={loadError} />
      </div>

      {profile && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"
          >
            <ErrorBanner message={saveError} />
            {saveSuccess && (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Profile updated.
              </p>
            )}
            <FormField label="Full name" value={profile.full_name} disabled />
            <FormField label="Email" value={profile.email} disabled />
            <FormField label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
            <FormField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <FormField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            <FormField
              label="Years of experience"
              type="number"
              min={0}
              max={60}
              step="0.5"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
            />
            <FormField
              label="Skills (comma-separated)"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Python, React, SQL"
            />
            <FormField
              label="Expected salary ($)"
              type="number"
              min={0}
              value={expectedSalary}
              onChange={(e) => setExpectedSalary(e.target.value)}
            />
            <Button type="submit" disabled={isSaving} className="mt-2 w-fit">
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </form>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Resume</h2>
            <p className="mt-1 text-sm text-slate-500">PDF only, up to 5MB.</p>

            <div className="mt-4">
              <ErrorBanner message={resumeError} />
            </div>

            {profile.has_resume ? (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <DocumentIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">Resume on file</p>
                  <p className="text-xs text-slate-500">Ready to view or share with HR</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-6 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <ArrowUpTrayIcon className="h-5 w-5" />
                </span>
                <p className="text-sm text-slate-500">No resume uploaded yet</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {profile.has_resume && (
                <Button variant="secondary" size="sm" onClick={() => setIsResumeViewerOpen(true)}>
                  View resume
                </Button>
              )}
              <Button
                variant={profile.has_resume ? "secondary" : "primary"}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingResume}
              >
                <ArrowUpTrayIcon className="h-4 w-4" />
                {isUploadingResume ? "Uploading…" : profile.has_resume ? "Replace" : "Upload resume"}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleResumeSelected}
              disabled={isUploadingResume}
              className="hidden"
            />
          </div>
        </div>
      )}

      <ResumeViewerDialog
        isOpen={isResumeViewerOpen}
        candidateName={profile?.full_name ?? "My"}
        fetchResume={downloadMyResume}
        onClose={() => setIsResumeViewerOpen(false)}
      />
    </Layout>
  );
}
