"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSchools, registerSchool } from "@/utils/school-actions";

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function loadSchools() {
    setLoading(true);
    const data = await getSchools();
    setSchools(data || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSchools();
  }, []);

  const statusConfig = {
    completed: { label: 'Completed', class: 'badge-success', icon: '✓' },
    scheduled: { label: 'Scheduled', class: 'badge-primary', icon: '◎' },
    assessed: { label: 'Assessed', class: 'badge-warning', icon: '◉' },
    registered: { label: 'Registered', class: 'badge-info', icon: '○' },
  };

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || school.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  async function handleRegister(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.target);
    const result = await registerSchool(formData);

    if (result.success) {
      setShowModal(false);
      loadSchools();
    } else {
      setError(result.error);
    }
    setIsSubmitting(false);
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">School Management</h1>
            <p className="page-subtitle">Manage participating schools and track their assessment progress</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <span>+</span> Register School
          </button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '28px',
        animation: 'fadeInUp 0.5s ease-out 0.1s both'
      }}>
        {[
          { label: 'Total Schools', value: schools.length, color: 'var(--primary-400)' },
          { label: 'Assessed', value: schools.filter(s => s.status === 'assessed').length, color: 'var(--warning-400)' },
          { label: 'Scheduled', value: schools.filter(s => s.status === 'scheduled').length, color: 'var(--info-400)' },
          { label: 'Completed', value: schools.filter(s => s.status === 'completed').length, color: 'var(--success-400)' },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: '18px 20px',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: stat.color, letterSpacing: '-1px' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '2px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '280px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="🔍  Search schools by name or district..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '6px', 
              background: 'var(--bg-glass)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '4px',
              border: '1px solid var(--border-subtle)'
            }}>
              {['all', 'registered', 'assessed', 'scheduled', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : ''}`}
                  style={{
                    border: 'none',
                    textTransform: 'capitalize',
                    fontSize: '11px',
                    padding: '5px 12px',
                    background: filterStatus === status ? undefined : 'transparent',
                    color: filterStatus === status ? 'white' : 'var(--text-secondary)',
                    boxShadow: filterStatus === status ? undefined : 'none'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="table-container">
          {loading ? (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading schools...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>District</th>
                  <th>Board</th>
                  <th>Contact Person</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map(school => {
                  const status = statusConfig[school.status] || statusConfig.registered;
                  return (
                    <tr key={school.id}>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)", letterSpacing: '-0.1px' }}>{school.name}</td>
                      <td>{school.district}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: 'var(--bg-glass-strong)',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          {school.board_type}
                        </span>
                      </td>
                      <td>{school.contact_person || '—'}</td>
                      <td><span className={`badge ${status.class}`}>{status.icon} {status.label}</span></td>
                      <td>
                        <Link href={`/schools/${school.id}`} className="section-action" style={{ textDecoration: 'none' }}>
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                
                {filteredSchools.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div className="empty-state-icon">🏫</div>
                        <div className="empty-state-title">No schools found</div>
                        <div className="empty-state-text">Try adjusting your search criteria or register a new school.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <div className="section-header">
              <h2 className="section-title">Register New School</h2>
              <button className="btn btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">School Name</label>
                <input type="text" name="name" className="form-input" required placeholder="e.g. Bharathi Vidya Bhavan" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">District</label>
                  <input type="text" name="district" className="form-input" required placeholder="e.g. Erode" />
                </div>
                <div className="form-group">
                  <label className="form-label">Board</label>
                  <select name="board_type" className="form-input" required>
                    <option value="CBSE">CBSE</option>
                    <option value="Matriculation">Matriculation</option>
                    <option value="Government">Government</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input type="text" name="contact_person" className="form-input" placeholder="e.g. Principal Sharma" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input type="text" name="phone" className="form-input" placeholder="e.g. +91 98765 43210" />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input type="email" name="email" className="form-input" placeholder="e.g. principal@school.edu" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea name="address" className="form-input" rows="2" placeholder="Full school address..."></textarea>
              </div>

              {error && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Register School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

