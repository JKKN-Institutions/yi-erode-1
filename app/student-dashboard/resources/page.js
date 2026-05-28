'use client';

import React, { useState } from 'react';
import { Card } from '@/components/Card';
import { Shield, BookOpen, Heart, EyeOff, ShieldAlert, ArrowLeft, Download } from 'lucide-react';
import styles from '@/app/dashboard.module.css';

export default function StudentResourcesPage() {
  const [selectedResource, setSelectedResource] = useState(null);

  const resources = [
    {
      id: '1',
      title: 'Saying No Guide',
      desc: 'Master peer pressure refusal tactics and assertive speech templates.',
      pillar: 'Pillar 1: Saying No',
      icon: Shield,
      colorClass: styles.statIconPrimary,
      content: [
        'Assertive Refusal: Say "No" firmly and directly without apologizing or making excuses.',
        'Broken Record: Repeat your decision calmly if pressured further: "No, I am not interested."',
        'Body Language: Maintain steady eye contact, stand upright, and use a firm, clear voice tone.',
        'Alternative Suggestions: Divert the activity: "Let\'s play basketball instead."'
      ]
    },
    {
      id: '2',
      title: 'Setting Boundaries',
      desc: 'Define and communicate personal physical, emotional, and social limits.',
      pillar: 'Pillar 2: Boundaries',
      icon: BookOpen,
      colorClass: styles.statIconSecondary,
      content: [
        'Identify Limits: Reflect on what situations make you feel uncomfortable or unsafe.',
        'Explicit Statements: Say: "I don\'t feel comfortable when you do that. Please stop."',
        'Establish Distance: It is okay to walk away from peer circles that violate your boundaries.',
        'No Justification Needed: You don\'t owe anyone an explanation for keeping yourself safe.'
      ]
    },
    {
      id: '3',
      title: 'Confidential Sharing',
      desc: 'Learn about secure reporting channels, anonymity, and trusted adults.',
      pillar: 'Pillar 3: Confidential Sharing',
      icon: EyeOff,
      colorClass: styles.statIconAccent,
      content: [
        'Pseudo Identity: You communicate with mentors using anonymous screen aliases.',
        'Trusted Circles: If you feel overwhelmed, reach out to school coordinators or JKKN counselors.',
        'Confidential Policy: Share details without fear of judgment; your privacy is protected.'
      ]
    },
    {
      id: '4',
      title: 'Substance Abuse Awareness',
      desc: 'Understanding the impact of substances on physical health and future potential.',
      pillar: 'Pillar 6: Substance Abuse',
      icon: ShieldAlert,
      colorClass: styles.statIconWarning,
      content: [
        'Health Impact: Substances alter brain development, memory, and cognitive decision making.',
        'Addiction Risk: Early usage significantly increases chemical dependency risks.',
        'Empowerment: Safe choices safeguard academic, professional, and personal goals.'
      ]
    }
  ];

  if (selectedResource) {
    return (
      <div className={styles.listGroup}>
        <div className={styles.headerSection}>
          <button 
            onClick={() => setSelectedResource(null)} 
            className="btn btn-glass" 
            style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
          >
            <ArrowLeft size={16} /> Back to Library
          </button>
          <h1 className={`${styles.dashboardTitle} gradient-text`}>{selectedResource.title}</h1>
          <p className={styles.dashboardSubtitle}>{selectedResource.pillar}</p>
        </div>

        <Card title="Guide Index & Key Takeaways">
          <div className={styles.listGroup}>
            {selectedResource.content.map((point, index) => (
              <div key={index} className={styles.listItem} style={{ alignItems: 'flex-start' }}>
                <div className={styles.listActivityLeft} style={{ marginTop: '0.25rem' }}>
                  <div className={`${styles.statIconWrapper} ${selectedResource.colorClass}`} style={{ padding: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{index + 1}</span>
                  </div>
                </div>
                <div className={styles.listInfo} style={{ flex: 1 }}>
                  <p className={styles.feedbackText} style={{ textAlign: 'left', lineHeight: '1.5' }}>
                    {point}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary flex items-center gap-2">
              <Download size={18} /> Download PDF Guide
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.listGroup}>
      <div className={styles.headerSection}>
        <h1 className={`${styles.dashboardTitle} gradient-text`}>Resource Library</h1>
        <p className={styles.dashboardSubtitle}>Empowering smart choices: Substance prevention articles, guides, and tools.</p>
      </div>

      <div className={styles.grid2Col}>
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <Card key={resource.id}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <div className={`${styles.statIconWrapper} ${resource.colorClass}`} style={{ width: 'fit-content', marginBottom: '1rem' }}>
                    <Icon size={24} />
                  </div>
                  <h3 className={styles.listTitle} style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{resource.title}</h3>
                  <p className={styles.dashboardSubtitle} style={{ fontSize: '0.875rem' }}>{resource.pillar}</p>
                  <p className={styles.feedbackText} style={{ textAlign: 'left', marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: '1.4' }}>
                    {resource.desc}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedResource(resource)}
                  className="btn btn-glass w-full text-sm"
                  style={{ marginTop: '1rem' }}
                >
                  Read Guide
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
