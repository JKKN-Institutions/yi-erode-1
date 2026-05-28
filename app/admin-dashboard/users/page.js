'use client';

import React, { useState } from 'react';
import { Card } from '@/components/Card';
import { UserCheck } from 'lucide-react';
import styles from '@/app/dashboard.module.css';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([
    { id: '1', name: 'Albus Dumbledore', email: 'albus@jkkn.edu.in', role: 'admin' },
    { id: '2', name: 'Minerva McGonagall', email: 'minerva@school.edu', role: 'school_coordinator' },
    { id: '3', name: 'Severus Snape', email: 'severus@mentor.jkkn.in', role: 'mentor' },
    { id: '4', name: 'Harry Potter', email: 'harry@student.com', role: 'student' },
    { id: '5', name: 'Ron Weasley', email: 'ron@student.com', role: 'unassigned' },
  ]);

  const [message, setMessage] = useState(null);

  const handleRoleChange = (userId, newRole) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
    const updatedUser = users.find(u => u.id === userId);
    if (updatedUser) {
      setMessage(`Successfully updated ${updatedUser.name}'s role to ${newRole.replace('_', ' ')}!`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return styles.badgePrimary;
      case 'school_coordinator':
        return styles.badgeSuccess;
      case 'mentor':
        return styles.badgeWarning;
      case 'student':
        return styles.badgePrimary; // standard student badge
      default:
        return styles.badgeWarning; // unassigned
    }
  };

  return (
    <div className={styles.listGroup}>
      <div className={styles.headerSection}>
        <h1 className={`${styles.dashboardTitle} gradient-text`}>Manage Users</h1>
        <p className={styles.dashboardSubtitle}>Review registration requests and manage roles for the Mission ON platform.</p>
      </div>

      {message && (
        <div className={`${styles.badge} ${styles.badgeSuccess}`} style={{ padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
          {message}
        </div>
      )}

      <Card title="All Users Roster">
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tr}>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Current Role</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={styles.tr}>
                  <td className={styles.td}>{user.name}</td>
                  <td className={styles.td} style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${getRoleBadgeClass(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <select 
                        className={styles.select}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="unassigned">Unassigned</option>
                        <option value="admin">Administrator</option>
                        <option value="school_coordinator">School Coordinator</option>
                        <option value="mentor">Mentor</option>
                        <option value="student">Student Learner</option>
                      </select>
                      <button className="btn btn-glass" style={{ padding: '0.35rem 0.5rem', borderRadius: '8px' }} title="User Verified">
                        <UserCheck size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
