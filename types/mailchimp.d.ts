declare module '@mailchimp/mailchimp_marketing' {
  export interface MailchimpPingResponse {
    health_status: string;
  }

  export interface MailchimpListMember {
    email_address: string;
    status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'transactional';
    merge_fields?: Record<string, any>;
  }

  interface ListsAPI {
    addListMember(listId: string, member: MailchimpListMember): Promise<any>;
    getListMember(listId: string, subscriberHash: string): Promise<any>;
  }

  interface PingAPI {
    get(): Promise<MailchimpPingResponse>;
  }

  interface MailchimpAPI {
    setConfig(config: {
      apiKey: string;
      server: string;
    }): void;
    
    ping: PingAPI;
    lists: ListsAPI;
  }

  const mailchimp: MailchimpAPI;
  export default mailchimp;
}
