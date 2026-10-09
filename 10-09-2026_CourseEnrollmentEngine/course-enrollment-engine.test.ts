import { describe, it, expect } from 'vitest';
import { attemptEnrollment, type Section, type Student } from './starter';

// --- Seam ---------------------------------------------------------------
// This is the only place that knows how a Section/Student get built and how
// an eligibility check gets made. If you refactor attemptEnrollment (split
// it, rename it, change its signature), update ONLY the helpers below - the
// test cases underneath should keep working unchanged as long as the
// observable eligibility/seat-consumption behavior stays the same shape.

function makeSection(overrides: Partial<Section> = {}): Section {
  return {
    id: 'CS201-A',
    courseCode: 'CS201',
    creditHours: 3,
    timeSlot: 'MWF 9:00-9:50',
    prerequisites: ['CS101'],
    seatsAvailable: 5,
    ...overrides,
  };
}

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: 's1',
    completedCourses: ['CS101'],
    schedule: [],
    currentCreditHours: 12,
    creditLimit: 18,
    ...overrides,
  };
}

function attemptEnroll(section: Section, student: Student) {
  return attemptEnrollment(section, student);
}

function scheduleFor(student: Student): Student['schedule'] {
  return student.schedule;
}
// -------------------------------------------------------------------------

describe('attemptEnrollment', () => {
  it('rejects a student missing a prerequisite', () => {
    const section = makeSection();
    const student = makeStudent({ completedCourses: [] });

    const result = attemptEnroll(section, student);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/prerequisite/i);
  });

  it('rejects a section that conflicts with an already-scheduled time slot', () => {
    const section = makeSection();
    const student = makeStudent({
      schedule: [{ sectionId: 'MATH210-A', courseCode: 'MATH210', timeSlot: 'MWF 9:00-9:50' }],
    });

    const result = attemptEnroll(section, student);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/time conflict/i);
  });

  it('rejects an enrollment that would exceed the credit hour limit for the term', () => {
    const section = makeSection({ creditHours: 4 });
    const student = makeStudent({ currentCreditHours: 16, creditLimit: 18 });

    const result = attemptEnroll(section, student);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/credit hour limit/i);
  });

  it('rejects enrollment in a section with no seats left', () => {
    const section = makeSection({ seatsAvailable: 0 });
    const student = makeStudent();

    const result = attemptEnroll(section, student);

    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/full/i);
  });

  it('enrolls an eligible student and consumes a seat', () => {
    const section = makeSection();
    const student = makeStudent();

    const result = attemptEnroll(section, student);

    expect(result.eligible).toBe(true);
    expect(result.reason).toMatch(/enrolled/i);
    expect(section.seatsAvailable).toBe(4);
    expect(student.currentCreditHours).toBe(15);
    expect(scheduleFor(student)).toEqual([
      { sectionId: 'CS201-A', courseCode: 'CS201', timeSlot: 'MWF 9:00-9:50' },
    ]);
  });
});
