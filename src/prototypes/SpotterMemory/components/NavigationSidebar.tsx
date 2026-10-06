import React, { useState } from 'react';
import { Icon } from '../../../components/icons';
import { sidebarStyles as styles } from '../styles';
import { navigationGroups, sectionNavigation } from '../data/mockData';
import { systemColors, referenceColors } from '../../../tokens/colors';
import { spacing } from '../../../tokens/spacing';

// External link icon
const ExternalLinkIcon: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 6.5V9.5C9 9.76522 8.89464 10.0196 8.70711 10.2071C8.51957 10.3946 8.26522 10.5 8 10.5H2.5C2.23478 10.5 1.98043 10.3946 1.79289 10.2071C1.60536 10.0196 1.5 9.76522 1.5 9.5V4C1.5 3.73478 1.60536 3.48043 1.79289 3.29289C1.98043 3.10536 2.23478 3 2.5 3H5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 1.5H10.5V4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 7L10.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * NavigationSidebar Component
 * 
 * Left navigation sidebar for Data Workspace with collapsible sections.
 * Follows ThoughtSpot content guidelines and spacing tokens.
 */
export const NavigationSidebar: React.FC = () => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['data-workspace']);
  const [activeItem, setActiveItem] = useState<string>('memory-sources');

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.B}px ${spacing.D}px`,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: systemColors.light['content-primary'],
    letterSpacing: '-0.1px',
  };

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${spacing.B}px`,
    padding: `${spacing.B}px ${spacing.D}px`,
    fontSize: '13px',
    color: isActive ? systemColors.light['content-brand'] : referenceColors.gray['70'],
    backgroundColor: isActive ? `${systemColors.light['content-brand']}08` : 'transparent',
    cursor: 'pointer',
    borderLeft: isActive ? `3px solid ${systemColors.light['content-brand']}` : '3px solid transparent',
    transition: 'all 0.15s ease',
    lineHeight: 1.4,
    fontWeight: isActive ? 500 : 400,
  });

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: systemColors.light['content-tertiary'],
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    padding: `${spacing.D}px ${spacing.D}px ${spacing.B}px`,
    marginTop: `${spacing.B}px`,
  };

  return (
    <nav style={styles.container}>
      {/* Data Workspace Group */}
      {navigationGroups.map(group => (
        <div key={group.id}>
          {/* Group Header */}
          <div 
            style={sectionHeaderStyle}
            onClick={() => toggleGroup(group.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={sectionTitleStyle}>{group.label}</span>
              <span style={{ color: systemColors.light['content-tertiary'], display: 'flex' }}>
                <Icon name="plus" size="xs" />
              </span>
            </div>
            <span style={{ color: systemColors.light['content-tertiary'], display: 'flex' }}>
              <Icon
                name={expandedGroups.includes(group.id) ? 'chevron-down' : 'chevron-right'}
                size="xs"
              />
            </span>
          </div>

          {/* Group Items */}
          {expandedGroups.includes(group.id) && (
            <div>
              {group.items.map(item => (
                <div
                  key={item.id}
                  style={navItemStyle(activeItem === item.id)}
                  onClick={() => handleItemClick(item.id)}
                >
                  <span>{item.label}</span>
                  {item.external && (
                    <span style={{ color: systemColors.light['content-tertiary'], display: 'flex' }}>
                      <ExternalLinkIcon />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Section Navigation */}
      {sectionNavigation.map(section => (
        <div key={section.section}>
          {/* Section Label */}
          <div style={sectionLabelStyle}>
            {section.section}
          </div>

          {/* Section Items */}
          {section.items.map(item => (
            <div
              key={item.id}
              style={navItemStyle(activeItem === item.id)}
              onClick={() => handleItemClick(item.id)}
            >
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
};

export default NavigationSidebar;
