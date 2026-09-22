import { apiClient } from "./client";
import type { Message, PaginatedResponse } from "../types";

export async function listInbox(page: number, pageSize = 20): Promise<PaginatedResponse<Message>> {
  const response = await apiClient.get<PaginatedResponse<Message>>("/messages/me", {
    params: { page, page_size: pageSize },
  });
  return response.data;
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<{ unread_count: number }>("/messages/me/unread-count");
  return response.data.unread_count;
}

export async function markRead(messageId: string): Promise<Message> {
  const response = await apiClient.patch<Message>(`/messages/${messageId}/read`);
  return response.data;
}

export async function sendBulkMessage(
  recipientCandidateIds: string[],
  subject: string,
  body: string
): Promise<Message[]> {
  const response = await apiClient.post<Message[]>("/messages/bulk", {
    recipient_candidate_ids: recipientCandidateIds,
    subject,
    body,
  });
  return response.data;
}
