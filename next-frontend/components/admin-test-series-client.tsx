'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { RichContent } from '@/components/rich-content';
import { parseQuestionBlock } from '@/lib/parse-questions';
import { adminTestApi, ApiError, QuestionInput, SeriesInput, TestInput } from '@/lib/student-api';
import { MockTest, StudentRecord, TestQuestion, TestSeries } from '@/lib/types';
import { useAdminSession } from '@/lib/use-admin-session';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const SAMPLE_BULK = `1. Which is the capital of Bihar?
A) Gaya
B) Patna
C) Bhagalpur
D) Muzaffarpur
Answer: B
Explanation: Patna is the capital of Bihar.

2. Which is the longest river in India?
A) Godavari
B) Ganga
C) Yamuna
D) Narmada
Answer: B`;

const emptySeries = (): SeriesInput => ({ title: '', slug: '', examName: '', category: '', description: '', isPublished: true });
const CATEGORY_SUGGESTIONS = ['Teaching', 'Banking', 'SSC', 'Railway', 'Defence', 'Police', 'State Exams', 'Engineering', 'Medical', 'Bihar Exams'];
const emptyTest = (): TestInput => ({
  title: '',
  kind: 'exam',
  category: '',
  language: 'English',
  difficulty: 'MEDIUM',
  durationMinutes: 30,
  marksPerQuestion: 1,
  negativeMarks: 0,
  isFeatured: false,
  isPublished: true,
  sortOrder: 0
});
const emptyQuestion = (): QuestionInput => ({ question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' });

function errorText(err: unknown) {
  return err instanceof Error ? err.message : 'Something went wrong';
}

export function AdminTestSeriesClient() {
  const { ready, isAuthenticated, token, logout } = useAdminSession();
  const [view, setView] = useState<'series' | 'students'>('series');
  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  // logout is a new function on every render; keep notify stable so data loaders don't refetch in a loop.
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const notify = useCallback((kind: 'ok' | 'error', text: string) => {
    setMessage({ kind, text });
    if (kind === 'error' && /admin login required/i.test(text)) logoutRef.current();
  }, []);

  const refreshSeries = useCallback(async () => {
    try {
      setSeriesList(await adminTestApi.listSeries(token));
    } catch (err) {
      notify('error', errorText(err));
    }
  }, [token, notify]);

  useEffect(() => {
    if (isAuthenticated) void refreshSeries();
  }, [isAuthenticated, refreshSeries]);

  if (!ready) return <section className="panel">Checking admin session…</section>;

  if (!isAuthenticated) {
    return (
      <section className="panel narrow">
        <h1 className="panel__title">Admin login required</h1>
        <p className="muted">Login from the admin page to manage test series.</p>
        <Link className="button button--primary" href="/admin">
          Go to admin login
        </Link>
      </section>
    );
  }

  const selectedSeries = seriesList.find((s) => s.id === selectedSeriesId) ?? null;

  return (
    <div className="admin-ts">
      <section className="page-intro page-intro--row">
        <div>
          <Link className="back-link" href="/admin">
            ← Admin panel
          </Link>
          <h1>Test series manager</h1>
          <p>Create a series, add tests to it, then add questions to each test.</p>
        </div>
        <div className="tabs tabs--compact" role="tablist">
          <button type="button" className={view === 'series' ? 'is-active' : ''} onClick={() => setView('series')}>
            Series &amp; tests
          </button>
          <button type="button" className={view === 'students' ? 'is-active' : ''} onClick={() => setView('students')}>
            Registered students
          </button>
        </div>
      </section>

      {message ? (
        <p className={message.kind === 'ok' ? 'form-success' : 'form-error'} role="status">
          {message.text}
        </p>
      ) : null}

      {view === 'students' ? (
        <StudentsTable token={token} onError={(text) => notify('error', text)} />
      ) : (
        <div className="admin-ts__grid">
          <aside className="panel admin-ts__side">
            <h2 className="panel__sub">Series</h2>
            <div className="admin-ts__list">
              {seriesList.map((series) => (
                <button
                  key={series.id}
                  type="button"
                  className={`admin-ts__item${series.id === selectedSeriesId ? ' is-active' : ''}`}
                  onClick={() => setSelectedSeriesId(series.id)}
                >
                  <strong>{series.title}</strong>
                  <span>
                    {series.category ? `${series.category} · ` : ''}
                    {series.testCount} tests · {series.studentCount} students
                    {!series.isPublished ? ' · Hidden' : ''}
                  </span>
                </button>
              ))}
              {seriesList.length === 0 ? <p className="muted">No series yet. Create the first one.</p> : null}
            </div>
            <button
              type="button"
              className={`button button--outline button--block${selectedSeriesId === 0 ? ' is-active' : ''}`}
              onClick={() => setSelectedSeriesId(0)}
            >
              + New series
            </button>
          </aside>

          <div className="admin-ts__main">
            {selectedSeriesId === 0 ? (
              <SeriesForm
                key="new"
                initial={emptySeries()}
                categories={seriesList.map((s) => s.category)}
                token={token}
                onSaved={async (saved) => {
                  notify('ok', `Series “${saved.title}” created. Now add tests to it.`);
                  await refreshSeries();
                  setSelectedSeriesId(saved.id);
                }}
                onError={(text) => notify('error', text)}
              />
            ) : selectedSeries ? (
              <>
                <SeriesForm
                  key={selectedSeries.id}
                  initial={{
                    title: selectedSeries.title,
                    slug: selectedSeries.slug,
                    examName: selectedSeries.examName,
                    category: selectedSeries.category,
                    description: selectedSeries.description,
                    isPublished: selectedSeries.isPublished
                  }}
                  logoUrl={selectedSeries.logoUrl}
                  ownLogoUrl={selectedSeries.ownLogoUrl}
                  onLogoChanged={async () => {
                    notify('ok', 'Logo updated.');
                    await refreshSeries();
                  }}
                  seriesId={selectedSeries.id}
                  categories={seriesList.map((s) => s.category)}
                  token={token}
                  onSaved={async () => {
                    notify('ok', 'Series saved.');
                    await refreshSeries();
                  }}
                  onDeleted={async () => {
                    notify('ok', 'Series deleted.');
                    setSelectedSeriesId(null);
                    await refreshSeries();
                  }}
                  onError={(text) => notify('error', text)}
                />
                <TestsManager
                  key={`tests-${selectedSeries.id}`}
                  series={selectedSeries}
                  token={token}
                  onChanged={refreshSeries}
                  notify={notify}
                />
              </>
            ) : (
              <section className="panel">
                <p className="muted">Select a series on the left, or create a new one.</p>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Series form ----
interface SeriesFormProps {
  initial: SeriesInput;
  seriesId?: number;
  logoUrl?: string;
  ownLogoUrl?: string;
  onLogoChanged?: () => void | Promise<void>;
  categories: string[];
  token: string;
  onSaved: (saved: TestSeries) => void | Promise<void>;
  onDeleted?: () => void | Promise<void>;
  onError: (text: string) => void;
}

function SeriesForm({ initial, seriesId, logoUrl, ownLogoUrl, onLogoChanged, categories, token, onSaved, onDeleted, onError }: SeriesFormProps) {
  const categoryOptions = [...new Set([...categories.filter(Boolean), ...CATEGORY_SUGGESTIONS])];
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const saved = seriesId ? await adminTestApi.updateSeries(seriesId, form, token) : await adminTestApi.createSeries(form, token);
      await onSaved(saved);
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!seriesId) return;
    setBusy(true);
    try {
      await adminTestApi.deleteSeries(seriesId, token);
      await onDeleted?.();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel admin-form" onSubmit={handleSubmit}>
      <div className="admin-form__head">
        <h2 className="panel__sub">{seriesId ? 'Series details' : 'New test series'}</h2>
        {seriesId && form.slug ? (
          <Link className="text-link" href={`/test-series/${form.slug}`} target="_blank">
            View page ↗
          </Link>
        ) : null}
      </div>
      <div className="form-grid">
        <label className="field field--wide">
          <span>Series title</span>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="BPSC TRE 4.0 Primary Teacher Mock Test 2026"
            required
          />
        </label>
        <label className="field">
          <span>Exam name</span>
          <input value={form.examName} onChange={(e) => setForm({ ...form, examName: e.target.value })} placeholder="BPSC TRE" />
        </label>
        <label className="field">
          <span>
            Category <em>(groups series on the website)</em>
          </span>
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            list="series-category-options"
            placeholder="Teaching / Banking / SSC"
          />
          <datalist id="series-category-options">
            {categoryOptions.map((item) => (
              <option value={item} key={item} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>
            Page URL <em>(auto from title if empty)</em>
          </span>
          <input value={form.slug ?? ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="bpsc-tre-4-mock-test" />
        </label>
        <label className="field field--wide">
          <span>Description</span>
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label className="check">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
          Visible on website
        </label>
        {seriesId ? (
          <LogoPicker
            seriesId={seriesId}
            ownUrl={ownLogoUrl ?? ''}
            inheritedUrl={logoUrl ?? ''}
            examName={form.examName}
            token={token}
            onChanged={onLogoChanged ?? (() => undefined)}
            onError={onError}
          />
        ) : (
          <p className="muted small field--wide">You can add a logo after creating the series.</p>
        )}
      </div>
      <div className="admin-form__actions">
        <button className="button button--primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : seriesId ? 'Save series' : 'Create series'}
        </button>
        {seriesId ? (
          confirmDelete ? (
            <span className="confirm-inline">
              Delete series, all its tests and results?
              <button className="button button--danger button--sm" type="button" onClick={handleDelete} disabled={busy}>
                Yes, delete
              </button>
              <button className="button button--ghost button--sm" type="button" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button className="button button--ghost" type="button" onClick={() => setConfirmDelete(true)}>
              Delete series
            </button>
          )
        ) : null}
      </div>
    </form>
  );
}

// ---- Series logo ----
interface LogoPickerProps {
  seriesId: number;
  ownUrl: string;
  inheritedUrl: string;
  examName: string;
  token: string;
  onChanged: () => void | Promise<void>;
  onError: (text: string) => void;
}

function LogoPicker({ seriesId, ownUrl, inheritedUrl, examName, token, onChanged, onError }: LogoPickerProps) {
  const [busy, setBusy] = useState(false);
  const [library, setLibrary] = useState<{ logoUrl: string; examName: string | null }[] | null>(null);
  const shownUrl = ownUrl || inheritedUrl;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      setLibrary(null);
      await onChanged();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function openLibrary() {
    try {
      setLibrary(await adminTestApi.listLogos(token));
    } catch (err) {
      onError(errorText(err));
    }
  }

  return (
    <div className="logo-picker field--wide">
      <span className="logo-picker__preview">
        {shownUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shownUrl} alt="Series logo" />
        ) : (
          <em>No logo</em>
        )}
      </span>
      <div className="logo-picker__body">
        <strong>Exam logo</strong>
        <span className="muted small">
          {ownUrl
            ? `Every series with exam name “${examName || '—'}” without its own logo uses this one too.`
            : inheritedUrl
              ? `Using the “${examName}” logo automatically. Upload only if this series needs a different one.`
              : 'PNG, JPG or WEBP under 1 MB; square works best. Upload once — other series with the same exam name reuse it.'}
        </span>
        <div className="logo-picker__actions">
          <label className={`button button--outline button--sm${busy ? ' is-disabled' : ''}`}>
            {busy ? 'Saving…' : ownUrl ? 'Change logo' : 'Upload logo'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) void run(() => adminTestApi.uploadLogo(seriesId, file, token));
              }}
            />
          </label>
          <button className="button button--ghost button--sm" type="button" disabled={busy} onClick={() => void openLibrary()}>
            Choose uploaded logo
          </button>
          {ownUrl ? (
            <button
              className="button button--ghost button--sm"
              type="button"
              disabled={busy}
              onClick={() => void run(() => adminTestApi.removeLogo(seriesId, token))}
            >
              Remove
            </button>
          ) : null}
        </div>

        {library ? (
          library.length > 0 ? (
            <div className="logo-library">
              {library.map((item) => (
                <button
                  key={item.logoUrl}
                  type="button"
                  className={`logo-library__item${item.logoUrl === ownUrl ? ' is-active' : ''}`}
                  disabled={busy}
                  onClick={() => void run(() => adminTestApi.useLogo(seriesId, item.logoUrl, token))}
                  title={item.examName ?? ''}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.logoUrl} alt="" />
                  <span>{item.examName || 'Logo'}</span>
                </button>
              ))}
            </div>
          ) : (
            <span className="muted small">No logos uploaded yet.</span>
          )
        ) : null}
      </div>
    </div>
  );
}

// ---- Tests ----
interface TestsManagerProps {
  series: TestSeries;
  token: string;
  onChanged: () => void | Promise<void>;
  notify: (kind: 'ok' | 'error', text: string) => void;
}

function TestsManager({ series, token, onChanged, notify }: TestsManagerProps) {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [openQuestions, setOpenQuestions] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setTests(await adminTestApi.listTests(series.id, token));
    } catch (err) {
      notify('error', errorText(err));
    }
  }, [series.id, token, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function afterChange(text: string) {
    notify('ok', text);
    await load();
    await onChanged();
  }

  return (
    <section className="panel">
      <div className="admin-form__head">
        <h2 className="panel__sub">Tests in this series ({tests.length})</h2>
        <button className="button button--outline button--sm" type="button" onClick={() => setEditing(0)}>
          + Add test
        </button>
      </div>

      {editing === 0 ? (
        <TestForm
          initial={emptyTest()}
          onCancel={() => setEditing(null)}
          onSubmit={async (input) => {
            const created = await adminTestApi.createTest(series.id, input, token);
            setEditing(null);
            setOpenQuestions(created.id);
            await afterChange(`Test “${created.title}” added. Now add its questions below.`);
          }}
          onError={(text) => notify('error', text)}
        />
      ) : null}

      <div className="admin-test-list">
        {tests.map((test) => (
          <div className="admin-test" key={test.id}>
            <div className="admin-test__row">
              <div>
                <strong>{test.title}</strong>
                <span className="muted">
                  {test.kind === 'exam' ? 'Exam test' : test.kind === 'pyq' ? 'Previous year paper' : 'Subject test'}
                  {test.category ? ` · ${test.category}` : ''} · {test.questionCount} questions · {test.durationMinutes} min ·{' '}
                  {test.attemptCount} attempts
                  {test.isFeatured ? ' · Free/Must attempt' : ''}
                  {!test.isPublished ? ' · Hidden' : ''}
                </span>
                {test.questionCount === 0 ? <span className="warn-note">Add questions — tests with no questions stay hidden.</span> : null}
              </div>
              <div className="admin-test__actions">
                <button
                  className="button button--primary button--sm"
                  type="button"
                  onClick={() => setOpenQuestions(openQuestions === test.id ? null : test.id)}
                >
                  {openQuestions === test.id ? 'Close questions' : 'Questions'}
                </button>
                <button className="button button--ghost button--sm" type="button" onClick={() => setEditing(editing === test.id ? null : test.id)}>
                  Edit
                </button>
              </div>
            </div>

            {editing === test.id ? (
              <TestForm
                initial={{
                  title: test.title,
                  kind: test.kind,
                  category: test.category,
                  language: test.language,
                  difficulty: test.difficulty,
                  durationMinutes: test.durationMinutes,
                  marksPerQuestion: test.marksPerQuestion,
                  negativeMarks: test.negativeMarks,
                  isFeatured: test.isFeatured,
                  isPublished: test.isPublished,
                  sortOrder: test.sortOrder
                }}
                onCancel={() => setEditing(null)}
                onSubmit={async (input) => {
                  await adminTestApi.updateTest(test.id, input, token);
                  setEditing(null);
                  await afterChange('Test saved.');
                }}
                onDelete={async () => {
                  await adminTestApi.deleteTest(test.id, token);
                  setEditing(null);
                  await afterChange('Test deleted.');
                }}
                onError={(text) => notify('error', text)}
              />
            ) : null}

            {openQuestions === test.id ? (
              <QuestionsManager testId={test.id} token={token} onChanged={() => afterChange('Questions updated.')} notify={notify} />
            ) : null}
          </div>
        ))}
        {tests.length === 0 && editing !== 0 ? <p className="muted">No tests yet. Click “Add test”.</p> : null}
      </div>
    </section>
  );
}

interface TestFormProps {
  initial: TestInput;
  onSubmit: (input: TestInput) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  onError: (text: string) => void;
}

function TestForm({ initial, onSubmit, onCancel, onDelete, onError }: TestFormProps) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof TestInput>(key: K, value: TestInput[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="admin-subform"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => onSubmit(form));
      }}
    >
      <div className="form-grid">
        <label className="field field--wide">
          <span>Test title</span>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Full Mock - 01" required />
        </label>
        <label className="field">
          <span>Type</span>
          <select value={form.kind} onChange={(e) => set('kind', e.target.value)}>
            <option value="exam">Exam test (full mock)</option>
            <option value="subject">Subject test</option>
            <option value="pyq">Previous year paper (PYQ)</option>
          </select>
        </label>
        <label className="field">
          <span>
            Category <em>(groups tests into tabs)</em>
          </span>
          <input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Full Mock Tests / Previous Year Paper / Geography" />
        </label>
        <label className="field">
          <span>Duration (minutes)</span>
          <input type="number" min={1} max={600} value={form.durationMinutes} onChange={(e) => set('durationMinutes', Number(e.target.value))} required />
        </label>
        <label className="field">
          <span>Marks per question</span>
          <input type="number" step="0.25" min={0.25} value={form.marksPerQuestion} onChange={(e) => set('marksPerQuestion', Number(e.target.value))} required />
        </label>
        <label className="field">
          <span>Negative marks (per wrong)</span>
          <input type="number" step="0.01" min={0} value={form.negativeMarks} onChange={(e) => set('negativeMarks', Number(e.target.value))} />
        </label>
        <label className="field">
          <span>Difficulty</span>
          <select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </label>
        <label className="field">
          <span>Language</span>
          <input value={form.language} onChange={(e) => set('language', e.target.value)} placeholder="English / Hindi / Bilingual" />
        </label>
        <label className="field">
          <span>
            Order <em>(lower shows first)</em>
          </span>
          <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} />
        </label>
        <label className="check">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
          Show in top “Free / Must attempt” section
        </label>
        <label className="check">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => set('isPublished', e.target.checked)} />
          Visible on website
        </label>
      </div>
      <div className="admin-form__actions">
        <button className="button button--primary button--sm" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save test'}
        </button>
        <button className="button button--ghost button--sm" type="button" onClick={onCancel}>
          Cancel
        </button>
        {onDelete ? (
          confirmDelete ? (
            <span className="confirm-inline">
              Delete this test and its results?
              <button className="button button--danger button--sm" type="button" disabled={busy} onClick={() => void run(onDelete)}>
                Yes, delete
              </button>
            </span>
          ) : (
            <button className="button button--ghost button--sm" type="button" onClick={() => setConfirmDelete(true)}>
              Delete test
            </button>
          )
        ) : null}
      </div>
    </form>
  );
}

// ---- Questions ----
interface QuestionsManagerProps {
  testId: number;
  token: string;
  onChanged: () => void | Promise<void>;
  notify: (kind: 'ok' | 'error', text: string) => void;
}

function QuestionsManager({ testId, token, onChanged, notify }: QuestionsManagerProps) {
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [mode, setMode] = useState<'bulk' | 'single'>('bulk');
  const [bulkText, setBulkText] = useState('');
  const [single, setSingle] = useState<QuestionInput>(emptyQuestion());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const parsed = bulkText.trim() ? parseQuestionBlock(bulkText) : null;

  const load = useCallback(async () => {
    try {
      setQuestions(await adminTestApi.listQuestions(testId, token));
    } catch (err) {
      notify('error', errorText(err));
    }
  }, [testId, token, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      await load();
      await onChanged();
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-questions">
      <div className="tabs tabs--compact">
        <button type="button" className={mode === 'bulk' ? 'is-active' : ''} onClick={() => setMode('bulk')}>
          Paste many
        </button>
        <button type="button" className={mode === 'single' ? 'is-active' : ''} onClick={() => setMode('single')}>
          Add one
        </button>
      </div>

      {mode === 'bulk' ? (
        <div className="admin-subform">
          <label className="field">
            <span>Paste questions — leave a blank line between questions</span>
            <textarea rows={10} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={SAMPLE_BULK} className="mono" />
          </label>
          {parsed ? (
            <div className="parse-report">
              <b>{parsed.questions.length} question(s) ready</b>
              {parsed.errors.map((err) => (
                <span className="form-error" key={err}>
                  {err}
                </span>
              ))}
            </div>
          ) : null}
          <div className="admin-form__actions">
            <button
              className="button button--primary button--sm"
              type="button"
              disabled={busy || !parsed || parsed.questions.length === 0 || parsed.errors.length > 0}
              onClick={() =>
                void run(async () => {
                  const res = await adminTestApi.addQuestions(testId, parsed!.questions, token);
                  setBulkText('');
                  notify('ok', `${res.added} question(s) added.`);
                })
              }
            >
              Add {parsed?.questions.length ?? 0} question(s)
            </button>
            <button className="button button--ghost button--sm" type="button" onClick={() => setBulkText(SAMPLE_BULK)}>
              Show example
            </button>
          </div>
        </div>
      ) : (
        <QuestionEditor
          value={single}
          onChange={setSingle}
          busy={busy}
          submitLabel="Add question"
          onSubmit={() =>
            run(async () => {
              await adminTestApi.addQuestions(testId, [single], token);
              setSingle(emptyQuestion());
            })
          }
        />
      )}

      <ol className="admin-qlist">
        {questions.map((q) => (
          <li key={q.id}>
            {editingId === q.id ? (
              <EditQuestion
                question={q}
                busy={busy}
                onCancel={() => setEditingId(null)}
                onSave={(input) =>
                  run(async () => {
                    await adminTestApi.updateQuestion(q.id, input, token);
                    setEditingId(null);
                  })
                }
              />
            ) : (
              <>
                <div className="admin-qlist__q">
                  <RichContent text={q.question} image={q.imageUrl} />
                </div>
                <p className="admin-qlist__opts">
                  {q.options.map((opt, i) => (
                    <span key={i} className={i === q.correctIndex ? 'is-answer' : ''}>
                      {LETTERS[i]}) <RichContent text={opt} image={q.optionImages?.[i]} />
                    </span>
                  ))}
                </p>
                <div className="admin-qlist__actions">
                  <button className="text-link" type="button" onClick={() => setEditingId(q.id)}>
                    Edit
                  </button>
                  <button
                    className="text-link text-link--danger"
                    type="button"
                    disabled={busy}
                    onClick={() => void run(() => adminTestApi.deleteQuestion(q.id, token).then(() => undefined))}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
      {questions.length === 0 ? <p className="muted">No questions yet.</p> : null}
    </div>
  );
}

function EditQuestion({
  question,
  busy,
  onSave,
  onCancel
}: {
  question: TestQuestion;
  busy: boolean;
  onSave: (input: QuestionInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<QuestionInput>({
    question: question.question,
    options: [...question.options],
    correctIndex: question.correctIndex ?? 0,
    explanation: question.explanation ?? ''
  });
  return <QuestionEditor value={value} onChange={setValue} busy={busy} submitLabel="Save question" onSubmit={() => onSave(value)} onCancel={onCancel} />;
}

interface QuestionEditorProps {
  value: QuestionInput;
  onChange: (value: QuestionInput) => void;
  onSubmit: () => Promise<void>;
  onCancel?: () => void;
  busy: boolean;
  submitLabel: string;
}

function QuestionEditor({ value, onChange, onSubmit, onCancel, busy, submitLabel }: QuestionEditorProps) {
  const setOption = (index: number, text: string) => {
    const options = [...value.options];
    options[index] = text;
    onChange({ ...value, options });
  };

  return (
    <form
      className="admin-subform"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
    >
      <label className="field">
        <span>Question</span>
        <textarea rows={3} value={value.question} onChange={(e) => onChange({ ...value, question: e.target.value })} required />
      </label>
      <div className="option-editor">
        {value.options.map((option, index) => (
          <div className="option-editor__row" key={index}>
            <label className="option-editor__radio" title="Mark as correct answer">
              <input
                type="radio"
                name="correct"
                checked={value.correctIndex === index}
                onChange={() => onChange({ ...value, correctIndex: index })}
              />
              {LETTERS[index]}
            </label>
            <input value={option} onChange={(e) => setOption(index, e.target.value)} placeholder={`Option ${LETTERS[index]}`} required />
            {value.options.length > 2 ? (
              <button
                type="button"
                className="text-link text-link--danger"
                onClick={() =>
                  onChange({
                    ...value,
                    options: value.options.filter((_, i) => i !== index),
                    correctIndex: value.correctIndex === index ? 0 : value.correctIndex > index ? value.correctIndex - 1 : value.correctIndex
                  })
                }
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
        {value.options.length < 6 ? (
          <button type="button" className="text-link" onClick={() => onChange({ ...value, options: [...value.options, ''] })}>
            + Add option
          </button>
        ) : null}
        <p className="muted small">Select the circle next to the correct answer.</p>
      </div>
      <label className="field">
        <span>
          Explanation <em>(optional, shown after submit)</em>
        </span>
        <textarea rows={2} value={value.explanation} onChange={(e) => onChange({ ...value, explanation: e.target.value })} />
      </label>
      <div className="admin-form__actions">
        <button className="button button--primary button--sm" type="submit" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
        {onCancel ? (
          <button className="button button--ghost button--sm" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

// ---- Students ----
function StudentsTable({ token, onError }: { token: string; onError: (text: string) => void }) {
  const [students, setStudents] = useState<StudentRecord[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    adminTestApi
      .listStudents(token)
      .then(setStudents)
      .catch((err) => onError(err instanceof ApiError ? err.message : errorText(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const q = query.trim().toLowerCase();
  const visible = (students ?? []).filter((s) => !q || s.name.toLowerCase().includes(q) || s.email.includes(q) || s.phone.includes(q));

  return (
    <section className="panel">
      <div className="admin-form__head">
        <h2 className="panel__sub">Registered students ({students?.length ?? '…'})</h2>
        <input className="search-input" placeholder="Search name, email or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Joined</th>
              <th>Tests taken</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.phone || '—'}</td>
                <td>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                <td>{s.attemptCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {students && visible.length === 0 ? <p className="muted">No students found.</p> : null}
      <p className="muted small">Passwords are stored encrypted (hashed) and cannot be seen by anyone, including admins.</p>
    </section>
  );
}
