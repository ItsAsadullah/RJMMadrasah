import {
  normalizeAcademicText,
  isHifzDepartment,
  departmentsMatch,
  matchesAcademicClass,
  resolveStudentForClass,
  parseRollNumber,
  getTargetClassRollStats,
  assignSequentialRolls,
  stripSecondaryAndVirtualFields,
} from "./secondaryEnrollment";

describe("secondaryEnrollment helpers", () => {
  test("normalizes Bengali whitespace, tabs, and ya-nukta", () => {
    expect(normalizeAcademicText("\tকিতাব ")).toBe("কিতাব");
    expect(normalizeAcademicText("চতুর্থ ")).toBe("চতুর্থ");
    expect(normalizeAcademicText("দ্বিতীয়")).toBe(normalizeAcademicText("দ্বিতীয়"));
  });

  test("parses Bengali and ASCII roll numbers", () => {
    expect(parseRollNumber("১২")).toBe(12);
    expect(parseRollNumber("18")).toBe(18);
    expect(parseRollNumber("")).toBe(0);
    expect(parseRollNumber(null)).toBe(0);
  });

  test("detects Hifz department variants", () => {
    expect(isHifzDepartment("হিফজুল কুরআন")).toBe(true);
    expect(isHifzDepartment("হিফজুল কুরআন বিভাগ")).toBe(true);
    expect(isHifzDepartment("হেফজখানা")).toBe(true);
    expect(isHifzDepartment("কিতাব")).toBe(false);
    expect(isHifzDepartment("নূরানী")).toBe(false);
  });

  test("distinguishes Kitab Class 4 from Noorani Class 4 while handling tabs/spaces", () => {
    const hifzDualStudent = {
      id: "s1",
      student_id: "260015",
      name_bn: "ফাতেমা খাতুন",
      department: "হিফজুল কুরআন",
      class_name: "আম শাখা",
      roll_number: "3",
      secondary_department: "\tকিতাব",
      secondary_class_name: "চতুর্থ ",
      secondary_roll_number: "18",
    };

    const kitabClass4 = { name: "চতুর্থ ", department: "\tকিতাব" };
    const nooraniClass4 = { name: "চতুর্থ", department: "নূরানী" };
    const hifzAmClass = { name: "আম শাখা", department: "হিফজুল কুরআন" };

    expect(matchesAcademicClass(hifzDualStudent, hifzAmClass)).toBe("primary");
    expect(matchesAcademicClass(hifzDualStudent, kitabClass4)).toBe("secondary");
    expect(matchesAcademicClass(hifzDualStudent, nooraniClass4)).toBeNull();

    const resolvedInKitab = resolveStudentForClass(hifzDualStudent, kitabClass4);
    expect(resolvedInKitab).not.toBeNull();
    expect(resolvedInKitab?.is_secondary_enrollment).toBe(true);
    expect(resolvedInKitab?.roll_number).toBe("18");
    expect(resolvedInKitab?.primary_roll_number).toBe("3");
    expect(resolvedInKitab?.origin_badge).toBe("হিফজখানা (আম শাখা)");
  });

  test("computes next serial roll numbers after highest existing roll in target class", () => {
    const allStudents = [
      { id: "1", branch_id: 7, academic_year: 2026, department: "\tকিতাব", class_name: "চতুর্থ ", roll_number: "৫" },
      { id: "2", branch_id: 7, academic_year: 2026, department: "\tকিতাব", class_name: "চতুর্থ ", roll_number: "12" },
      { id: "3", branch_id: 7, academic_year: 2026, department: "হিফজুল কুরআন", class_name: "আম শাখা", roll_number: "1", secondary_department: "\tকিতাব", secondary_class_name: "চতুর্থ ", secondary_roll_number: "14" },
      { id: "4", branch_id: 7, academic_year: 2026, department: "নূরানী", class_name: "চতুর্থ", roll_number: "99" },
    ];

    const stats = getTargetClassRollStats(allStudents, {
      name: "চতুর্থ ",
      department: "\tকিতাব",
      branch_id: 7,
      academic_year: 2026,
    });
    expect(stats).toEqual({ existingCount: 3, maxRoll: 14, nextRoll: 15 });

    const assigned = assignSequentialRolls(
      [
        { id: "h2", student_id: "260020", name_bn: "খাদিজা", roll_number: "8" },
        { id: "h1", student_id: "260010", name_bn: "আয়েশা", roll_number: "2" },
      ],
      stats.nextRoll
    );
    expect(assigned.map((a) => ({ id: a.student.id, roll: a.assignedRoll }))).toEqual([
      { id: "h1", roll: "15" },
      { id: "h2", roll: "16" },
    ]);
  });

  test("strips secondary and virtual fields from student payload", () => {
    const cleaned = stripSecondaryAndVirtualFields({
      name_bn: "আয়েশা",
      class_name: "আম শাখা",
      secondary_class_name: "চতুর্থ",
      secondary_department: "কিতাব",
      secondary_roll_number: "15",
      origin_badge: "হিফজখানা",
    });
    expect(cleaned).toEqual({ name_bn: "আয়েশা", class_name: "আম শাখা" });
  });

  test("matches department families across legacy and short names", () => {
    expect(departmentsMatch("\tকিতাব", "কিতাব বিভাগ")).toBe(true);
    expect(departmentsMatch("নূরানী", "নূরানী ও মক্তব বিভাগ")).toBe(true);
    expect(departmentsMatch("কিতাব", "নূরানী")).toBe(false);
  });
});
