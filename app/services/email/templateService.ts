

export async function getTemplatesForEvent(eventType: string) {
    const db = {} as any;
     return db
        .selectFrom('templates')
        .innerJoin('event_template', 'templates.template_id', 'event_template.template_id')
        .where('event_template.event_type', '=', eventType)
        .execute();
}