import React from 'react';
import { useParams } from 'react-router-dom';
import { AssignmentList } from './AssignmentList';

interface AssignmentDetailProps {
  viewMode?: 'workspace' | 'report';
}

export const AssignmentDetail: React.FC<AssignmentDetailProps> = ({ viewMode = 'workspace' }) => {
  const { id, sid } = useParams<{ id?: string; sid?: string }>();

  return (
    <AssignmentList
      routeAssignmentId={id}
      routeSubmissionId={sid}
      viewMode={viewMode}
    />
  );
};
