import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SemesterGradesPanel,
  type Grade,
  type SemesterSummary,
  type FetchSemesterGrades,
} from './starter';

// --- Seam ---------------------------------------------------------------
// The only place that knows how SemesterGradesPanel is constructed, how a
// semester tab gets selected, and how fetchSemesterGrades results get
// back into it. If you refactor the component's internals (the reducer, a
// ref, a request id, whatever you like), update ONLY the helpers in this
// block - the test cases below should keep working unchanged as long as
// the component's public props and rendered output stay the same shape.

const SEMESTERS: SemesterSummary[] = [
  { id: 'f24', label: 'Fall 2024' },
  { id: 's25', label: 'Spring 2025' },
];

function renderPanel(
  fetchSemesterGrades: FetchSemesterGrades,
  semesters: SemesterSummary[] = SEMESTERS
) {
  return render(
    <SemesterGradesPanel semesters={semesters} fetchSemesterGrades={fetchSemesterGrades} />
  );
}

function fetchGradesResolvingWith(grades: Grade[]): FetchSemesterGrades {
  return () => Promise.resolve(grades);
}

function fetchGradesRejectingWith(message: string): FetchSemesterGrades {
  return () => Promise.reject(new Error(message));
}

function selectSemester(semesterId: string) {
  fireEvent.click(screen.getByTestId(`semester-tab-${semesterId}`));
}
// -------------------------------------------------------------------------

describe('SemesterGradesPanel', () => {
  it('shows an idle prompt and no grades before any semester is selected', () => {
    const fetchSemesterGrades = vi.fn();
    renderPanel(fetchSemesterGrades);

    expect(screen.getByTestId('status-message')).toHaveTextContent('Select a semester');
    expect(screen.queryByTestId('grades-result')).not.toBeInTheDocument();
    expect(fetchSemesterGrades).not.toHaveBeenCalled();
  });

  it('shows a loading indicator immediately after a semester tab is clicked', async () => {
    const fetchSemesterGrades: FetchSemesterGrades = () => new Promise(() => {}); // never resolves
    renderPanel(fetchSemesterGrades);

    selectSemester('f24');

    expect(await screen.findByTestId('status-message')).toHaveTextContent('Loading grades');
  });

  it('renders every course once the fetch resolves', async () => {
    const fetchSemesterGrades = fetchGradesResolvingWith([
      { course: 'CS 201', credits: 4, letterGrade: 'A-' },
      { course: 'MATH 110', credits: 3, letterGrade: 'B+' },
    ]);
    renderPanel(fetchSemesterGrades);

    selectSemester('f24');

    expect(await screen.findByTestId('grades-semester-label')).toHaveTextContent('Fall 2024');
    expect(screen.getByTestId('grade-row-CS 201')).toHaveTextContent('A- (4 cr)');
    expect(screen.getByTestId('grade-row-MATH 110')).toHaveTextContent('B+ (3 cr)');
  });

  it('marks the clicked tab as pressed and leaves the other one unpressed', async () => {
    const fetchSemesterGrades = fetchGradesResolvingWith([
      { course: 'CS 201', credits: 4, letterGrade: 'A-' },
    ]);
    renderPanel(fetchSemesterGrades);

    selectSemester('f24');
    await screen.findByTestId('grades-result');

    expect(screen.getByTestId('semester-tab-f24')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('semester-tab-s25')).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows an error message and no grades when the fetch rejects', async () => {
    const fetchSemesterGrades = fetchGradesRejectingWith('transcript service unreachable');
    renderPanel(fetchSemesterGrades);

    selectSemester('f24');

    expect(await screen.findByRole('alert')).toHaveTextContent('transcript service unreachable');
    expect(screen.queryByTestId('grades-result')).not.toBeInTheDocument();
  });

  it('loads the newly selected semester when a different tab is clicked after one is already loaded', async () => {
    const fetchSemesterGrades = vi.fn((semesterId: string) =>
      Promise.resolve(
        semesterId === 'f24'
          ? [{ course: 'CS 201', credits: 4, letterGrade: 'A-' }]
          : [{ course: 'CS 330', credits: 4, letterGrade: 'B' }]
      )
    );
    renderPanel(fetchSemesterGrades);

    selectSemester('f24');
    expect(await screen.findByTestId('grades-semester-label')).toHaveTextContent('Fall 2024');

    selectSemester('s25');
    expect(await screen.findByTestId('grades-semester-label')).toHaveTextContent('Spring 2025');

    expect(fetchSemesterGrades).toHaveBeenCalledTimes(2);
  });
});
