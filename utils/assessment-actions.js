'use server';

import { createClient } from '@/utils/supabase/server';
import { getServerRole } from '@/utils/auth-server';

// Calculate Category based on specific weightings (Z > Y > X, R > Q > P for ties)
function calculateCategoryA(counts) {
  const { X = 0, Y = 0, Z = 0 } = counts;
  if (Z > X && Z > Y) return 'A3';
  if (Y > X && Y > Z) return 'A2';
  if (X > Y && X > Z) return 'A1';
  
  // Handling ties - prioritize severity
  if (Z === Y && Z > X) return 'A3';
  if (Z === X && Z > Y) return 'A3';
  if (Y === X && Y > Z) return 'A2';
  
  return 'A2'; // Default middle ground if somehow completely flat
}

function calculateCategoryB(counts) {
  const { P = 0, Q = 0, R = 0 } = counts;
  if (R > P && R > Q) return 'B3';
  if (Q > P && Q > R) return 'B2';
  if (P > Q && P > R) return 'B1';
  
  // Handling ties - prioritize severity
  if (R === Q && R > P) return 'B3';
  if (R === P && R > Q) return 'B3';
  if (Q === P && Q > R) return 'B2';
  
  return 'B2';
}

export async function submitAssessment(formData) {
  try {
    const supabase = await createClient();
    const { user, school_id } = await getServerRole();
    const grade = formData.metadata.grade;

    if (!school_id) {
      return { success: false, error: 'No school assigned to this account.' };
    }

    if (!grade) {
      return { success: false, error: 'Grade is required for assessment.' };
    }

    const categoryA = calculateCategoryA(formData.countsA);
    const categoryB = calculateCategoryB(formData.countsB);
    const moduleCode = `${categoryA}-${categoryB}`;

    // 1. Save the assessment record
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert([{
        school_id: school_id,
        category_a: categoryA,
        category_b: categoryB,
        module_code: moduleCode,
        responses: {
          metadata: formData.metadata,
          answersA: formData.answersA,
          answersB: formData.answersB
        },
        assessed_by: user?.email || 'coordinator'
      }])
      .select()
      .single();

    if (assessmentError) throw assessmentError;

    // 1.5. Ensure grade is added to schools.grades array in background
    try {
      const { data: school } = await supabase
        .from('schools')
        .select('grades')
        .eq('id', school_id)
        .single();
        
      if (school) {
        const currentGrades = school.grades || [];
        const gradeStr = grade.toString();
        if (!currentGrades.map(g => g.toString()).includes(gradeStr)) {
          const updatedGrades = [...currentGrades, gradeStr];
          await supabase
            .from('schools')
            .update({ grades: updatedGrades })
            .eq('id', school_id);
        }
      }
    } catch (e) {
      console.warn("Non-fatal error updating schools.grades array:", e.message);
    }

    // 2. Update the grade-specific status
    const { error: gradeError } = await supabase
      .from('school_grade_status')
      .upsert({
        school_id: school_id,
        grade: grade,
        status: 'assessed',
        module_code: moduleCode,
        last_assessment_id: assessment.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'school_id, grade' });

    if (gradeError) throw gradeError;

    return { 
      success: true, 
      moduleCode, 
      assessmentId: assessment.id,
      message: 'Analysis complete.' 
    };
  } catch (error) {
    console.error('Submission Error:', error);
    return { success: false, error: error.message || 'Failed to process assessment.' };
  }
}

export async function scheduleSession(scheduleData) {
  try {
    const supabase = await createClient();
    const { school_id } = await getServerRole();

    if (!school_id) throw new Error("No school linked to your account.");
    if (!scheduleData.grade) throw new Error("Grade is required for scheduling.");

    // 1. Create the session
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert([{
        school_id: school_id,
        grade: scheduleData.grade,
        session_type: scheduleData.type || 'initial',
        session_date: scheduleData.date,
        start_time: scheduleData.time,
        status: 'planned'
      }]);

    if (sessionError) throw sessionError;

    // 2. Update grade status
    const { error: gradeError } = await supabase
      .from('school_grade_status')
      .update({ status: 'scheduled' })
      .eq('school_id', school_id)
      .eq('grade', scheduleData.grade);

    if (gradeError) throw gradeError;
    
    return { success: true, message: 'Session successfully scheduled.' };
  } catch(error) {
    console.error('Scheduling Error:', error);
    return { success: false, error: error.message || 'Failed to schedule.' };
  }
}
