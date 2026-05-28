"use client";

import { useState, useEffect } from "react";
import { getSchoolsProcessTracking } from "@/utils/admin-data-actions";
import { 
  Search, MapPin, CheckCircle, Calendar, Users, 
  MessageSquare, ChevronDown, ChevronUp, AlertCircle, Award, Activity 
} from "lucide-react";
import Link from "next/link";

export default function SchoolProcessTrackingPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [expandedSchools, setExpandedSchools] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getSchoolsProcessTracking();
        setSchools(data || []);
        
        // Auto-expand the first school if available
        if (data && data.length > 0) {
          setExpandedSchools({ [data[0].id]: true });
        }
      } catch (err) {
        console.error("Error loading process tracking data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleExpand = (schoolId) => {
    setExpandedSchools(prev => ({
      ...prev,
      [schoolId]: !prev[schoolId]
    }));
  };

  // Extract all unique districts for filter dropdown
  const districts = ["all", ...new Set(schools.map(s => s.district).filter(Boolean))];

  const filteredSchools = schools.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDistrict = filterDistrict === "all" || s.district === filterDistrict;
    return matchesSearch && matchesDistrict;
  });

  // Helper to determine active step based on status
  const getStepIndex = (status) => {
    switch (status) {
      case 'registered': return 0;
      case 'assessed': return 1;
      case 'scheduled': return 2;
      case 'completed': return 4; // 3 is attendance logged (implicit in scheduled -> completed)
      default: return 0;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 className="page-title" style={{
            background: 'linear-gradient(135deg, #a5b4fc, #818cf8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>
            📈 School Process Tracking
          </h1>
          <p className="page-subtitle">Monitor implementation progression, baseline questionnaires, sessions, attendance, and feedback closeouts.</p>
        </div>
        <Link href="/schools" className="btn btn-secondary">
          🏫 Manage Schools List
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Search */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
              <Search size={16} />
            </span>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search schools by name or contact person..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px', width: '100%' }}
            />
          </div>

          {/* District Filter */}
          <div style={{ minWidth: '200px' }}>
            <select
              className="form-input"
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              style={{ width: '100%', textTransform: 'capitalize' }}
            >
              <option value="all">All Districts</option>
              {districts.filter(d => d !== "all").map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--primary-400)" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          Loading school process parameters...
        </div>
      ) : filteredSchools.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <AlertCircle size={36} style={{ margin: '0 auto 12px auto', color: 'var(--text-tertiary)' }} />
          <h3>No Schools Found</h3>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your search query or filter settings.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredSchools.map((school) => {
            const isExpanded = !!expandedSchools[school.id];
            const totalGrades = school.grades?.length || 0;
            const completedGrades = school.grades?.filter(g => g.status === 'completed').length || 0;
            
            return (
              <div 
                key={school.id} 
                className="card" 
                style={{ 
                  padding: '0', 
                  overflow: 'hidden',
                  border: isExpanded ? '1px solid rgba(129, 140, 248, 0.25)' : '1px solid var(--border-subtle)',
                  boxShadow: isExpanded ? '0 10px 30px -10px rgba(0,0,0,0.3), 0 0 1px 1px rgba(129, 140, 248, 0.1) inset' : undefined,
                  transition: 'all 0.3s'
                }}
              >
                {/* School Summary Header Row */}
                <div 
                  onClick={() => toggleExpand(school.id)}
                  style={{ 
                    padding: '24px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    background: isExpanded ? 'rgba(99, 102, 241, 0.02)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: isExpanded ? 'var(--primary-glow)' : 'var(--bg-glass-strong)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                      border: '1px solid var(--border-subtle)', color: isExpanded ? 'var(--primary-400)' : 'var(--text-secondary)'
                    }}>
                      🏫
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {school.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} /> <span style={{ textTransform: 'capitalize' }}>{school.district}</span>
                        </span>
                        <span>•</span>
                        <span>{school.boardType} Board</span>
                        {school.contactPerson && (
                          <>
                            <span>•</span>
                            <span>POC: {school.contactPerson}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Completion Tracker Badge */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600 }}>Grade Progression</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: completedGrades === totalGrades && totalGrades > 0 ? 'var(--success-400)' : 'var(--text-secondary)' }}>
                          {completedGrades} / {totalGrades} Complete
                        </span>
                        <div style={{ width: '80px', height: '6px', background: 'var(--bg-glass-strong)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${totalGrades > 0 ? (completedGrades / totalGrades) * 100 : 0}%`, 
                            height: '100%', 
                            background: completedGrades === totalGrades && totalGrades > 0 ? 'var(--success-400)' : 'var(--primary-400)'
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Expand Arrow */}
                    <button style={{
                      background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px'
                    }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Expanded school grades progression view */}
                {isExpanded && (
                  <div style={{ padding: '24px', background: 'rgba(0,0,0,0.06)' }}>
                    {totalGrades === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)', fontSize: '13.5px' }}>
                        ⚠️ No grades enrolled in this school dashboard yet. School coordinator needs to activate a grade from their dashboard.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {school.grades.map((gInfo) => {
                          const activeStepIdx = getStepIndex(gInfo.status);
                          
                          // Determine details for step 2 (scheduling)
                          const hasSessions = gInfo.sessions && gInfo.sessions.length > 0;
                          const scheduledSession = gInfo.sessions?.[0]; // Show main scheduled info
                          
                          // Determine details for step 3 (attendance)
                          const attendanceLogged = gInfo.sessions?.find(s => s.attendance !== null);
                          
                          // Determine details for step 4 (feedback)
                          const feedbackLogged = gInfo.sessions?.find(s => s.feedback !== null);

                          return (
                            <div 
                              key={gInfo.grade} 
                              style={{ 
                                background: 'var(--bg-glass)', 
                                border: '1px solid var(--border-subtle)', 
                                borderRadius: '12px',
                                padding: '20px',
                                animation: 'fadeInUp 0.3s ease-out'
                              }}
                            >
                              {/* Grade Summary Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Grade {gInfo.grade}</span>
                                  <span style={{ 
                                    fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px',
                                    background: gInfo.moduleCode ? 'var(--accent-glow)' : 'var(--bg-glass-strong)',
                                    color: gInfo.moduleCode ? 'var(--accent-400)' : 'var(--text-tertiary)',
                                    border: gInfo.moduleCode ? '1px solid var(--accent-400)' : '1px solid var(--border-subtle)'
                                  }}>
                                    {gInfo.moduleCode ? `Matrix: ${gInfo.moduleCode}` : 'Baseline Not Complete'}
                                  </span>
                                </div>
                                <span style={{
                                  fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                                  background: gInfo.status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : gInfo.status === 'scheduled' ? 'rgba(251, 191, 36, 0.12)' : 'var(--bg-glass-strong)',
                                  color: gInfo.status === 'completed' ? 'var(--success-400)' : gInfo.status === 'scheduled' ? 'var(--warning-400)' : 'var(--text-secondary)',
                                  textTransform: 'uppercase'
                                }}>
                                  {gInfo.status}
                                </span>
                              </div>

                              {/* Progress Timeline Pipeline */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', position: 'relative' }}>
                                
                                {/* Step 1: Baseline Questionnaire */}
                                <div style={{ 
                                  padding: '14px', borderRadius: '10px', background: 'var(--bg-elevated)', 
                                  border: gInfo.moduleCode ? '1px solid rgba(16, 185, 129, 0.2)' : '1px dashed var(--border-subtle)',
                                  opacity: gInfo.moduleCode ? 1 : 0.6
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{
                                      width: '24px', height: '24px', borderRadius: '50%',
                                      background: gInfo.moduleCode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                                      color: gInfo.moduleCode ? 'var(--success-400)' : 'var(--text-tertiary)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                                    }}>
                                      {gInfo.moduleCode ? <CheckCircle size={14} /> : "1"}
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>1. Baseline Matrix</span>
                                  </div>
                                  {gInfo.moduleCode ? (
                                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                      <div>Module Code: <strong style={{ color: 'var(--accent-400)' }}>{gInfo.moduleCode}</strong></div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Demographic: {gInfo.categoryA} • Risk: {gInfo.categoryB}</div>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', italic: 'true' }}>Waiting for Coordinator to complete questionnaire</span>
                                  )}
                                </div>

                                {/* Step 2: Session Scheduled */}
                                <div style={{ 
                                  padding: '14px', borderRadius: '10px', background: 'var(--bg-elevated)', 
                                  border: hasSessions ? '1px solid rgba(16, 185, 129, 0.2)' : '1px dashed var(--border-subtle)',
                                  opacity: hasSessions ? 1 : 0.6
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{
                                      width: '24px', height: '24px', borderRadius: '50%',
                                      background: hasSessions ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                                      color: hasSessions ? 'var(--success-400)' : 'var(--text-tertiary)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                                    }}>
                                      {hasSessions ? <CheckCircle size={14} /> : "2"}
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>2. Sessions</span>
                                  </div>
                                  {hasSessions ? (
                                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                      <div style={{ fontWeight: 600 }}>{gInfo.sessions.length} Session(s) Scheduled</div>
                                      {scheduledSession && (
                                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                          📅 Next: {new Date(scheduledSession.date).toLocaleDateString()} at {scheduledSession.time}
                                          {scheduledSession.mentors && <div style={{ marginTop: '2px', wordBreak: 'break-word' }}>👥 Mentors: {scheduledSession.mentors}</div>}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No sessions scheduled yet</span>
                                  )}
                                </div>

                                {/* Step 3: Attendance Logged */}
                                <div style={{ 
                                  padding: '14px', borderRadius: '10px', background: 'var(--bg-elevated)', 
                                  border: attendanceLogged ? '1px solid rgba(16, 185, 129, 0.2)' : '1px dashed var(--border-subtle)',
                                  opacity: attendanceLogged ? 1 : 0.6
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{
                                      width: '24px', height: '24px', borderRadius: '50%',
                                      background: attendanceLogged ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                                      color: attendanceLogged ? 'var(--success-400)' : 'var(--text-tertiary)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                                    }}>
                                      {attendanceLogged ? <CheckCircle size={14} /> : "3"}
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>3. Attendance</span>
                                  </div>
                                  {attendanceLogged ? (
                                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                      {gInfo.sessions.map(s => {
                                        if (s.attendance) {
                                          const rate = s.attendance.strength > 0 ? Math.round((s.attendance.attended / s.attendance.strength) * 100) : 0;
                                          return (
                                            <div key={s.id} style={{ marginBottom: '4px' }}>
                                              <strong style={{ color: 'var(--primary-400)' }}>{s.attendance.attended} / {s.attendance.strength}</strong> ({rate}%)
                                              {s.attendance.absentees && (
                                                <div style={{ fontSize: '10.5px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.attendance.absentees}>
                                                  Absentees: {s.attendance.absentees}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Attendance not logged yet</span>
                                  )}
                                </div>

                                {/* Step 4: Qualitative Feedback */}
                                <div style={{ 
                                  padding: '14px', borderRadius: '10px', background: 'var(--bg-elevated)', 
                                  border: feedbackLogged ? '1px solid rgba(16, 185, 129, 0.2)' : '1px dashed var(--border-subtle)',
                                  opacity: feedbackLogged ? 1 : 0.6
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{
                                      width: '24px', height: '24px', borderRadius: '50%',
                                      background: feedbackLogged ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                                      color: feedbackLogged ? 'var(--success-400)' : 'var(--text-tertiary)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                                    }}>
                                      {feedbackLogged ? <CheckCircle size={14} /> : "4"}
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>4. Feedback & Close</span>
                                  </div>
                                  {feedbackLogged ? (
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                      {gInfo.sessions.map(s => {
                                        if (s.feedback) {
                                          return (
                                            <div key={s.id}>
                                              <div style={{ fontStyle: 'italic', borderLeft: '2px solid var(--success-400)', paddingLeft: '6px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }} title={s.feedback}>
                                                &quot;{s.feedback}&quot;
                                              </div>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Feedback & Closeout pending</span>
                                  )}
                                </div>

                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
