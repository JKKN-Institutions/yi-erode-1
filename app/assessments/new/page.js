"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { submitAssessment } from "@/utils/assessment-actions";

const questionsA = [
  { id: 'a1', text: "How would you describe the students' general awareness of substance abuse risks?", options: [ { val: 'X', label: 'Low/None' }, { val: 'Y', label: 'Moderate' }, { val: 'Z', label: 'High' } ] },
  { id: 'a2', text: "What is the typical socio-economic background of the student majority?", options: [ { val: 'X', label: 'Underserved/Rural' }, { val: 'Y', label: 'Middle Class' }, { val: 'Z', label: 'Urban/Affluent' } ] },
  { id: 'a3', text: "Has the school conducted similar awareness programs in the last 2 years?", options: [ { val: 'X', label: 'Never' }, { val: 'Y', label: 'Once' }, { val: 'Z', label: 'Regularly' } ] },
  { id: 'a4', text: "Access to digital technology for students in this grade is:", options: [ { val: 'X', label: 'Limited' }, { val: 'Y', label: 'Shared/Moderate' }, { val: 'Z', label: 'Direct/Personal' } ] },
  { id: 'a5', text: "Parental involvement in school health initiatives is typically:", options: [ { val: 'X', label: 'Passive' }, { val: 'Y', label: 'Supportive' }, { val: 'Z', label: 'Proactive' } ] },
];

const questionsB = [
  { id: 'b1', text: "Frequency of reported behavioral issues in this grade:", options: [ { val: 'P', label: 'Rare' }, { val: 'Q', label: 'Occasional' }, { val: 'R', label: 'Frequent' } ] },
  { id: 'b2', text: "Observed level of peer pressure influence among students:", options: [ { val: 'P', label: 'Minimal' }, { val: 'Q', label: 'Noticeable' }, { val: 'R', label: 'High' } ] },
  { id: 'b3', text: "Students' willingness to share personal concerns with teachers:", options: [ { val: 'P', label: 'Open' }, { val: 'Q', label: 'Hesitant' }, { val: 'R', label: 'Guarded' } ] },
  { id: 'b4', text: "Availability of counseling services or support groups in the school:", options: [ { val: 'P', label: 'Excellent' }, { val: 'Q', label: 'Average' }, { val: 'R', label: 'None' } ] },
  { id: 'b5', text: "Community influence regarding substance exposure around the school area:", options: [ { val: 'P', label: 'Safe/Isolated' }, { val: 'Q', label: 'Mixed' }, { val: 'R', label: 'High Risk' } ] },
];

export default function NewAssessmentPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading assessment...</div>}>
      <AssessmentForm />
    </Suspense>
  );
}

function AssessmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const grade = searchParams.get('grade');
  
  const [step, setStep] = useState(1);
  const [answersA, setAnswersA] = useState({});
  const [answersB, setAnswersB] = useState({});
  const [loading, setLoading] = useState(false);

  if (!grade) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--danger-400)' }}>Error: No grade specified</h1>
        <p>Please return to the dashboard and select a grade to assess.</p>
        <button className="btn btn-secondary" onClick={() => router.push('/school-dashboard')}>Return Home</button>
      </div>
    );
  }

  const handleStep1 = (e) => {
    e.preventDefault();
    if (Object.keys(answersA).length < questionsA.length) {
      alert("Please answer all questions in Category A.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(answersB).length < questionsB.length) {
      alert("Please answer all questions in Category B.");
      return;
    }

    setLoading(true);
    
    // Calculate counts
    const countsA = { X: 0, Y: 0, Z: 0 };
    Object.values(answersA).forEach(val => countsA[val]++);
    
    const countsB = { P: 0, Q: 0, R: 0 };
    Object.values(answersB).forEach(val => countsB[val]++);

    const formData = {
      metadata: { grade },
      answersA,
      answersB,
      countsA,
      countsB
    };

    const result = await submitAssessment(formData);
    setLoading(false);
    
    if (result.success) {
      router.push(`/school-dashboard/sessions?success=assessed`);
    } else {
      alert(result.error || "Failed to submit assessment.");
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Module Planning Assessment</h1>
        <p className="page-subtitle">Assessing Grade {grade} for custom module assignment</p>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
             <div style={{ flex: 1, height: '4px', background: 'var(--accent-400)', borderRadius: '2px' }} />
             <div style={{ flex: 1, height: '4px', background: step === 2 ? 'var(--accent-400)' : 'var(--border-subtle)', borderRadius: '2px' }} />
        </div>

        <form onSubmit={step === 1 ? handleStep1 : handleSubmit}>
          {step === 1 ? (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Category A: Demographic & Infrastructure</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '24px' }}>These questions help us understand the structural context of the grade.</p>
              
              {questionsA.map((q, idx) => (
                <div key={q.id} style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                    {idx + 1}. {q.text}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {q.options.map(opt => (
                      <label key={opt.val} style={{
                        padding: '12px', borderRadius: '10px', background: answersA[q.id] === opt.val ? 'var(--accent-glow)' : 'var(--bg-glass)',
                        border: answersA[q.id] === opt.val ? '1px solid var(--accent-400)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                      }}>
                        <input type="radio" name={q.id} value={opt.val} style={{ display: 'none' }} onChange={() => setAnswersA({...answersA, [q.id]: opt.val})} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: answersA[q.id] === opt.val ? 'var(--accent-400)' : 'var(--text-secondary)' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>Next: Behavioral Assessment</button>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Category B: Behavioral & Risk Factors</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '24px' }}>These questions assess the specific behavioral risks within this grade level.</p>
              
              {questionsB.map((q, idx) => (
                <div key={q.id} style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
                    {idx + 1}. {q.text}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {q.options.map(opt => (
                      <label key={opt.val} style={{
                        padding: '12px', borderRadius: '10px', background: answersB[q.id] === opt.val ? 'var(--accent-glow)' : 'var(--bg-glass)',
                        border: answersB[q.id] === opt.val ? '1px solid var(--accent-400)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                      }}>
                        <input type="radio" name={q.id} value={opt.val} style={{ display: 'none' }} onChange={() => setAnswersB({...answersB, [q.id]: opt.val})} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: answersB[q.id] === opt.val ? 'var(--accent-400)' : 'var(--text-secondary)' }}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                  {loading ? 'Analyzing...' : 'Submit Assessment'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
