import { PostmarkAdapter } from '../postmarkAdapter';

const sendEmailWithTemplate = jest.fn();
jest.mock(
  'postmark',
  () => ({
    ServerClient: jest.fn().mockImplementation(() => ({ sendEmailWithTemplate })),
  }),
  { virtual: true }
);

it('sends email with template', async () => {
  const adapter = new PostmarkAdapter();
  await adapter.send(['a@test.com'], '1', { name: 'Test' });
  expect(sendEmailWithTemplate).toHaveBeenCalledWith({
    From: process.env.EMAIL_FROM!,
    To: 'a@test.com',
    TemplateId: Number('1'),
    TemplateModel: { name: 'Test' },
  });
});
