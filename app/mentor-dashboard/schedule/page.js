'use client';

import React, { useState } from 'react';
import { Card } from '@/components/Card';
import { School, Calendar, Plus, Trash2, Clock } from 'lucide-react';
import styles from '@/app/dashboard.module.css';

export default function MentorSchedulePage() {
  const [slots, setSlots] = useState([
    { id: '1', day: 'Monday', time: '10:00 AM - 12:00 PM' },
    { id: '2', day: 'Wednesday', time: '02:00 PM - 04:00 PM' },
  ]);

  const [day, setDay] = useState('Monday');
  const [time, setTime] = useState('10:00 AM - 12:00 PM');

  const handleAddSlot = (e) => {
    e.preventDefault();
    const newSlot = {
      id: Date.now().toString(),
      day,
      time,
    };
    setSlots(prev => [...prev, newSlot]);
  };

  const handleRemoveSlot = (id) => {
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className={styles.listGroup}>
      <div className={styles.headerSection}>
        <h1 className={`${styles.dashboardTitle} gradient-text`}>My Schedule & Roster</h1>
        <p className={styles.dashboardSubtitle}>Manage your weekly session availability slots and view assigned school allocations.</p>
      </div>

      <div className={styles.grid2Col}>
        <Card title="Manage Availability">
          <form onSubmit={handleAddSlot} className={styles.listGroup}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Day</label>
              <select className={styles.select} value={day} onChange={(e) => setDay(e.target.value)}>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Time Slot</label>
              <select className={styles.select} value={time} onChange={(e) => setTime(e.target.value)}>
                <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
                <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM</option>
                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={18} /> Add Slot
            </button>
          </form>
        </Card>

        <Card title="Allocated Schools">
          <div className={styles.listGroup}>
            {[
              { name: 'JKKN Matriculation School', location: 'Erode', grades: 'Grade 9 & 10' },
              { name: 'Government Girls High School', location: 'Erode Chapters', grades: 'Grade 11' }
            ].map((school, i) => (
              <div key={i} className={styles.listItem}>
                <div className={styles.listActivityLeft}>
                  <div className={`${styles.statIconWrapper} ${styles.statIconPrimary}`} style={{ padding: '0.5rem' }}>
                    <School size={20} />
                  </div>
                  <div className={styles.listInfo}>
                    <p className={styles.listTitle}>{school.name}</p>
                    <p className={styles.listMeta}>{school.location} • {school.grades}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="My Active Availability Slots">
        {slots.length === 0 ? (
          <div className={styles.emptyPlaceholder}>
            <Clock size={32} className={styles.placeholderIcon} />
            <p>No availability slots defined. Please add a slot above.</p>
          </div>
        ) : (
          <div className={styles.listGroup}>
            {slots.map((slot) => (
              <div key={slot.id} className={styles.listItem}>
                <div className={styles.listActivityLeft}>
                  <Calendar size={18} className="text-[hsl(var(--primary))]" />
                  <div className={styles.listInfo}>
                    <p className={styles.listTitle}>{slot.day}</p>
                    <p className={styles.listMeta}>{slot.time}</p>
                  </div>
                </div>
                <button 
                  className="btn btn-glass" 
                  style={{ color: 'hsl(var(--danger))', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                  onClick={() => handleRemoveSlot(slot.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
