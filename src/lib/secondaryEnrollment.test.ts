import {
  normalizeAcademicText,
  isHifzDepartment,
  departmentsMatch,
  matchesAcademicClass,
  resolveStudentForClass,
  buildSecondaryEnrollmentFields,
} from "./secondaryEnrollment";

describe("secondaryEnrollment helpers", () => {
  test("normalizes Bengali whitespace, tabs, and ya-nukta", () => {
    expect(normalizeAcademicText("\tকিতাব ")).toBe("কিতাব");
    expect(normalizeAcademicText("চতুর্থ ")).toBe("চতুর্থ");
    expect(normalizeAcademicText("দ্বিতীয়")).toBe(normalizeAcademicText("দ্বিতীয়"));
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

    const resolvedInHifz = resolveStudentForClass(hifzDualStudent, hifzAmClass);
    expect(resolvedInHifz?.is_secondary_enrollment).toBe(false);
    expect(resolvedInHifz?.roll_number).toBe("3");
    expect(resolvedInHifz?.secondary_badge).toBe("কিতাব: চতুর্থ (রোল: 18)");
  });

  test("omits secondary fields when empty and DB record lacks secondary columns", () => {
    expect(
      buildSecondaryEnrollmentFields(
        { secondary_department: "", secondary_class_name: "", secondary_roll_number: "" },
        { id: "1", class_name: "আম শাখা" }
      )
    ).toEqual({});

    expect(
      buildSecondaryEnrollmentFields(
        { secondary_department: "", secondary_class_name: "", secondary_roll_number: "" },
        { id: "1", class_name: "আম শাখা", secondary_class_name: "চতুর্থ" }
      )
    ).toEqual({
      secondary_department: null,
      secondary_class_name: null,
      secondary_roll_number: null,
    });
  });

  test("matches department families across legacy and short names", () => {
    expect(departmentsMatch("\tকিতাব", "কিতাব বিভাগ")).toBe(true);
    expect(departmentsMatch("নূরানী", "নূরানী ও মক্তব বিভাগ")).toBe(true);
    expect(departmentsMatch("কিতাব", "নূরানী")).toBe(false);
  });
});
