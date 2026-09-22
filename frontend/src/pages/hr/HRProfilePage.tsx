import { useEffect, useState, type FormEvent } from "react";
import { getMyProfile, updateMyProfile } from "../../api/hr";
import { getErrorMessage } from "../../api/client";
import { ErrorBanner } from "../../components/ErrorBanner";
import { FormField } from "../../components/FormField";
import { Layout } from "../../components/Layout";
import { Spinner } from "../../components/Spinner";
import type { HRProfile } from "../../types";

export function HRProfilePage() {
  const [profile, setProfile] = useState<HRProfile | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [designation, setDesignation] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setProfile(data);
        setCompanyName(data.company_name);
        setDesignation(data.designation ?? "");
      })
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!companyName.trim()) {
      setSaveError("Company name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateMyProfile({
        company_name: companyName.trim(),
        designation: designation.trim() || null,
      });
      setProfile(updated);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
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
      <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>
      <ErrorBanner message={loadError} />

      {profile && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex max-w-xl flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6"
        >
          <ErrorBanner message={saveError} />
          {saveSuccess && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Profile updated.
            </p>
          )}
          <FormField label="Full name" value={profile.full_name} disabled />
          <FormField label="Email" value={profile.email} disabled />
          <FormField label="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <FormField label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
          <button
            type="submit"
            disabled={isSaving}
            className="mt-2 w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </Layout>
  );
}
