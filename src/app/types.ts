export interface Activity {
  id: string;
  name: string;
  color: string;
}

export interface ActivityLog {
  id: string;
  activityId: string;
  hours: number;
  date: string;
}
