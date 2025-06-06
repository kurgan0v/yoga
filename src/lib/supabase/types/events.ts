// Типы для событий календаря
export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: 'practice' | 'broadcast' | 'community' | 'reminder';
  start_time: string; // TIMESTAMPTZ в формате ISO
  end_time?: string; // TIMESTAMPTZ в формате ISO
  content_id?: string;
  user_id?: string;
  thumbnail_url?: string;
  color?: string;
  created_at: string;
  updated_at: string;
 }
 
 export interface EventFormData {
  title: string;
  description?: string;
  event_type: 'practice' | 'broadcast' | 'community' | 'reminder';
  start_time: string;
  end_time?: string;
  content_id?: string;
  user_id?: string;
  thumbnail_url?: string;
  color?: string;
 }