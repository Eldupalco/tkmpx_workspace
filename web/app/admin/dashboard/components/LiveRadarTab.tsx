'use client';

import { Attendance } from '@/features/attendance';
import { LivePresenceCard } from '@/features/users';

interface LiveRadarTabProps {
  currentlyInList: Attendance[];
}

export function LiveRadarTab({ currentlyInList }: LiveRadarTabProps) {
  return <LivePresenceCard currentlyInList={currentlyInList} />;
}
