export const sendEmailWithTemplate = jest.fn();
export const sendEmail = jest.fn();
export class ServerClient {
  sendEmailWithTemplate = sendEmailWithTemplate;
  sendEmail = sendEmail;

}
