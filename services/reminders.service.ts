import axios from 'axios';
import { API_BASE_URL } from '@/constants/api';

const api = axios.create({ baseURL: API_BASE_URL });

export type Reminder = {
  id: string;
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
};

export type CreateReminderInput = {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
};

export type UpdateReminderInput = Partial<CreateReminderInput>;

export type ExtractedEventData = {
  summary?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
};

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const remindersService = {
  async list(accessToken: string): Promise<Reminder[]> {
    const { data } = await api.get<Reminder[]>('/reminders', {
      headers: authHeader(accessToken),
    });
    return data;
  },

  async get(accessToken: string, id: string): Promise<Reminder> {
    const { data } = await api.get<Reminder>(`/reminders/${id}`, {
      headers: authHeader(accessToken),
    });
    return data;
  },

  async create(accessToken: string, input: CreateReminderInput): Promise<Reminder> {
    const { data } = await api.post<Reminder>('/reminders', input, {
      headers: authHeader(accessToken),
    });
    return data;
  },

  async update(accessToken: string, id: string, input: UpdateReminderInput): Promise<Reminder> {
    const { data } = await api.put<Reminder>(`/reminders/${id}`, input, {
      headers: authHeader(accessToken),
    });
    return data;
  },

  async remove(accessToken: string, id: string): Promise<void> {
    await api.delete(`/reminders/${id}`, {
      headers: authHeader(accessToken),
    });
  },

  async extractFromImage(accessToken: string, imageBase64: string, mimeType: string): Promise<ExtractedEventData> {
    const { data } = await api.post<ExtractedEventData>(
      '/reminders/extract-from-image',
      { image: imageBase64, mediaType: mimeType },
      { headers: authHeader(accessToken) },
    );
    return data;
  },
};
