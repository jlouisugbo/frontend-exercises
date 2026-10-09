// Enrollment eligibility + seat-booking for BrightPath University's course
// registration portal. Shipped in the scramble before add/drop reopened for
// spring term - one pass: check the rules, and if everything lines up, take
// the seat.

export interface Section {
  id: string;
  courseCode: string;
  creditHours: number;
  timeSlot: string; // e.g. "MWF 9:00-9:50"
  prerequisites: string[]; // course codes the student must have completed
  seatsAvailable: number;
}

export interface ScheduleEntry {
  sectionId: string;
  courseCode: string;
  timeSlot: string;
}

export interface Student {
  id: string;
  completedCourses: string[];
  schedule: ScheduleEntry[];
  currentCreditHours: number;
  creditLimit: number;
}

export interface EnrollmentResult {
  eligible: boolean;
  reason: string;
}

/**
 * Checks whether `student` can enroll in `section`, and - if so - enrolls
 * them.
 *
 * Wired directly to the "Enroll" button on the course registration page.
 */
export function attemptEnrollment(section: Section, student: Student): EnrollmentResult {
  const missingPrerequisites = section.prerequisites.filter(
    (course) => !student.completedCourses.includes(course)
  );

  if (missingPrerequisites.length > 0) {
    return {
      eligible: false,
      reason: `Missing prerequisites: ${missingPrerequisites.join(", ")}`,
    };
  }

  const hasTimeConflict = student.schedule.some(
    (entry) => entry.timeSlot === section.timeSlot
  );

  if (hasTimeConflict) {
    return {
      eligible: false,
      reason: "Time conflict with an already-scheduled section.",
    };
  }

  if (student.currentCreditHours + section.creditHours > student.creditLimit) {
    return {
      eligible: false,
      reason: "Would exceed credit hour limit for the term.",
    };
  }

  if (section.seatsAvailable <= 0) {
    return {
      eligible: false,
      reason: "Section is full.",
    };
  }

  // Everything checks out - lock in the seat.
  section.seatsAvailable -= 1;
  student.schedule.push({
    sectionId: section.id,
    courseCode: section.courseCode,
    timeSlot: section.timeSlot,
  });
  student.currentCreditHours += section.creditHours;

  return {
    eligible: true,
    reason: "Enrolled.",
  };
}
