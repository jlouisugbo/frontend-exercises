// Pathwise advising console - the semester grades panel advisors pull up
// during a drop-in session while a student is sitting across the desk,
// flipping between semesters to spot trends before making a
// recommendation. Built in a hurry after advisors kept asking for "just
// tabs, no page reload" instead of the old per-semester route.

import { useReducer, useState } from 'react';

export interface Grade {
  course: string;
  credits: number;
  letterGrade: string;
}

export interface SemesterSummary {
  id: string;
  label: string;
}

export type FetchSemesterGrades = (semesterId: string) => Promise<Grade[]>;

export type GradesStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface GradesState {
  status: GradesStatus;
  semesterId: string | null;
  grades: Grade[] | null;
  errorMessage: string | null;
}

type GradesAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; semesterId: string; grades: Grade[] }
  | { type: 'LOAD_ERROR'; message: string };

const initialState: GradesState = {
  status: 'idle',
  semesterId: null,
  grades: null,
  errorMessage: null,
};

// Centralizing the fetch lifecycle in a reducer so the upcoming "compare
// two semesters" view can reuse the same transitions for both panes
// without copy-pasting four setState calls per pane.
function gradesReducer(state: GradesState, action: GradesAction): GradesState {
  switch (action.type) {
    case 'LOAD_START':
      return { status: 'loading', semesterId: null, grades: null, errorMessage: null };
    case 'LOAD_SUCCESS':
      return {
        status: 'loaded',
        semesterId: action.semesterId,
        grades: action.grades,
        errorMessage: null,
      };
    case 'LOAD_ERROR':
      return { status: 'error', semesterId: null, grades: null, errorMessage: action.message };
    default:
      return state;
  }
}

export interface SemesterGradesPanelProps {
  semesters: SemesterSummary[];
  fetchSemesterGrades: FetchSemesterGrades;
}

export function SemesterGradesPanel({ semesters, fetchSemesterGrades }: SemesterGradesPanelProps) {
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);
  const [state, dispatch] = useReducer(gradesReducer, initialState);

  function handleSelectSemester(semesterId: string) {
    setActiveSemesterId(semesterId);
    dispatch({ type: 'LOAD_START' });

    fetchSemesterGrades(semesterId)
      .then((grades) => {
        dispatch({ type: 'LOAD_SUCCESS', semesterId, grades });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        dispatch({ type: 'LOAD_ERROR', message });
      });
  }

  const activeLabel = semesters.find((s) => s.id === state.semesterId)?.label ?? state.semesterId;

  return (
    <div data-testid="grades-panel">
      <ul data-testid="semester-tabs">
        {semesters.map((semester) => (
          <li key={semester.id}>
            <button
              data-testid={`semester-tab-${semester.id}`}
              onClick={() => handleSelectSemester(semester.id)}
              aria-pressed={activeSemesterId === semester.id}
            >
              {semester.label}
            </button>
          </li>
        ))}
      </ul>

      <div data-testid="grades-body">
        {state.status === 'idle' && (
          <p data-testid="status-message">Select a semester to view grades.</p>
        )}

        {state.status === 'loading' && (
          <p data-testid="status-message" role="status">
            Loading grades…
          </p>
        )}

        {state.status === 'error' && (
          <p data-testid="status-message" role="alert">
            Couldn't load grades: {state.errorMessage}
          </p>
        )}

        {state.status === 'loaded' && state.grades && (
          <div data-testid="grades-result">
            <p data-testid="grades-semester-label">{activeLabel}</p>
            <ul data-testid="grades-list">
              {state.grades.map((grade) => (
                <li key={grade.course} data-testid={`grade-row-${grade.course}`}>
                  {grade.course}: {grade.letterGrade} ({grade.credits} cr)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
