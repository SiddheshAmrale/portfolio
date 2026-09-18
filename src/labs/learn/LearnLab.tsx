import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Workbench from '../../apps/Workbench';
import { Btn, Kpi, Panel } from '../../apps/ui';
import { usePilotJson } from '../pilot/load';

const ACCENT = '#f472b6';

type Lesson = {
  id: string;
  title: string;
  must_know: string;
  why: string;
  practice: { lab: string; task: string; pass: string };
  check: string[];
};

type Track = {
  id: string;
  title: string;
  target_roles: string[];
  keywords: string[];
  lessons: Lesson[];
};

type Curriculum = {
  software: string;
  disclaimer: string;
  tracks: Track[];
};

const LearnLab: React.FC = function () {
  const { data, error, loading } = usePilotJson<Curriculum>('/learn/curriculum.json');
  const [trackId, setTrackId] = useState('credo-pilot');
  const [lessonIdx, setLessonIdx] = useState(0);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [view, setView] = useState('lesson');

  const track = useMemo(function () {
    if (!data) return null;
    return data.tracks.find(function (t) { return t.id === trackId; }) || data.tracks[0];
  }, [data, trackId]);

  const lesson = track && track.lessons[lessonIdx] ? track.lessons[lessonIdx] : null;

  if (loading) return <div className="app-workbench flex items-center justify-center text-white/50">Loading curriculum…</div>;
  if (error || !data || !track || !lesson) return <div className="app-workbench p-8 text-rose-300">Could not load /learn/curriculum.json. {error}</div>;

  const doneCount = track.lessons.filter(function (l) { return done[track.id + ':' + l.id]; }).length;

  return (
    <Workbench
      product="Guided Practical Academy"
      domain="Must-know concepts · hands-on"
      accent={ACCENT}
      views={[
        { id: 'lesson', label: 'Lesson' },
        { id: 'map', label: 'Track map' },
        { id: 'keywords', label: 'Keywords' }
      ]}
      view={view}
      onView={setView}
      statusLeft={data.software}
      statusRight={track.title + ' · ' + doneCount + '/' + track.lessons.length}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap gap-2">
          {data.tracks.map(function (t) {
            return (
              <Btn
                key={t.id}
                kind={t.id === track.id ? 'primary' : 'ghost'}
                accent={ACCENT}
                onClick={function () { setTrackId(t.id); setLessonIdx(0); setView('lesson'); }}
              >
                {t.title}
              </Btn>
            );
          })}
        </div>
        <p className="text-xs text-white/45 leading-relaxed">{data.disclaimer}</p>

        {view === 'lesson' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              {track.lessons.map(function (l, i) {
                const key = track.id + ':' + l.id;
                return (
                  <button
                    key={l.id}
                    onClick={function () { setLessonIdx(i); }}
                    className={'w-full text-left text-sm px-3 py-2 rounded border ' + (i === lessonIdx ? 'border-pink-400/50 bg-pink-500/10 text-white' : 'border-white/10 text-white/70 hover:bg-white/5')}
                  >
                    <span className={'font-mono text-[10px] mr-2 ' + (done[key] ? 'text-emerald-400' : 'text-white/30')}>{done[key] ? 'DONE' : 'TODO'}</span>
                    {l.title}
                  </button>
                );
              })}
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Kpi label="Progress" value={doneCount + '/' + track.lessons.length} />
                <Kpi label="Roles" value={String(track.target_roles.length)} hint={track.target_roles[0]} />
              </div>
              <Panel title={'Must know · ' + lesson.title}>
                <p className="text-sm text-white/85 leading-relaxed">{lesson.must_know}</p>
                <p className="text-sm text-white/50 mt-3"><span className="text-white/70">Why it matters: </span>{lesson.why}</p>
              </Panel>
              <Panel title="Practice in the webapp">
                <p className="text-sm text-white/80">{lesson.practice.task}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={lesson.practice.lab} className="text-xs px-3 py-1.5 rounded bg-pink-500/90 text-black font-semibold">Open {lesson.practice.lab}</Link>
                  <Btn
                    accent={ACCENT}
                    onClick={function () {
                      const key = track.id + ':' + lesson.id;
                      setDone(function (prev) {
                        return { ...prev, [key]: true };
                      });
                    }}
                  >
                    Mark practiced
                  </Btn>
                </div>
                <p className="text-xs text-white/45 mt-3">Pass bar: {lesson.practice.pass}</p>
              </Panel>
              <Panel title="Self-check">
                <ul className="list-disc pl-5 text-sm text-white/70 space-y-1">
                  {lesson.check.map(function (q) {
                    return <li key={q}>{q}</li>;
                  })}
                </ul>
              </Panel>
              <div className="flex gap-2">
                <Btn kind="ghost" disabled={lessonIdx === 0} onClick={function () { setLessonIdx(lessonIdx - 1); }}>Previous</Btn>
                <Btn accent={ACCENT} disabled={lessonIdx >= track.lessons.length - 1} onClick={function () { setLessonIdx(lessonIdx + 1); }}>Next lesson</Btn>
              </div>
            </div>
          </div>
        ) : null}

        {view === 'map' ? (
          <Panel title="Track map">
            <p className="text-sm text-white/60 mb-3">Target roles: {track.target_roles.join(' · ')}</p>
            <ol className="list-decimal pl-5 text-sm text-white/75 space-y-2">
              {track.lessons.map(function (l) {
                return <li key={l.id}>{l.title} → <code className="text-white/50">{l.practice.lab}</code></li>;
              })}
            </ol>
          </Panel>
        ) : null}

        {view === 'keywords' ? (
          <Panel title="Interview keywords for this track">
            <div className="flex flex-wrap gap-2">
              {track.keywords.map(function (k) {
                return <span key={k} className="text-xs px-2 py-1 rounded border border-white/15 text-white/70">{k}</span>;
              })}
            </div>
          </Panel>
        ) : null}
      </div>
    </Workbench>
  );
};

export default LearnLab;
