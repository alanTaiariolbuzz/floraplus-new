export interface EmailSender {
  send(
    to: string[],
    templateId: string,
    data: Record<string, unknown>,
    options?: {
      from?: string;
      replyTo?: string;
      fromName?: string;
    }
  ): Promise<void>;
}
