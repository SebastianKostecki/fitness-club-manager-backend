// services/brevoService.js
// @getbrevo/brevo - leniwa inicjalizacja przy pierwszym użyciu

let transactionalApi = null;
let SendSmtpEmailCtor = null;
let sdkName = null;

console.log('[brevoService] Using SDK: @getbrevo/brevo');

function getTransactionalApi() {
  if (transactionalApi) {
    return transactionalApi;
  }

  if (!process.env.BREVO_API_KEY) {
    throw new Error('Missing BREVO_API_KEY');
  }

  const Brevo = require('@getbrevo/brevo');
  const defaultClient = Brevo.ApiClient.instance;
  defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
  transactionalApi = new Brevo.TransactionalEmailsApi();
  SendSmtpEmailCtor = Brevo.SendSmtpEmail;
  sdkName = '@getbrevo/brevo';
  console.log('[brevoService] Initialized SDK:', sdkName);
  return transactionalApi;
}

/**
 * Wysyłka maila na podstawie szablonu Brevo.
 * @param {Object} opts
 * @param {Array|Object|String} opts.to - { email, name } lub string, lub tablica takich obiektów
 * @param {number|string} opts.templateId
 * @param {Object} opts.params - parametry do {{ params.* }} w szablonie Brevo
 * @param {string} [opts.senderEmail]
 * @param {string} [opts.senderName]
 * @param {string} [opts.replyToEmail]
 * @param {string[]} [opts.tags]
 */
async function sendTemplate({ 
  to, 
  templateId = Number(process.env.BREVO_TEMPLATE_ID), 
  params = {}, 
  senderEmail = process.env.BREVO_SENDER_EMAIL, 
  senderName = process.env.BREVO_SENDER_NAME,
  replyToEmail,
  tags
}) {
  if (!process.env.BREVO_API_KEY) throw new Error('Missing BREVO_API_KEY');
  if (!templateId) throw new Error('Missing templateId');
  
  const api = getTransactionalApi(); // Leniwa inicjalizacja
  const mail = new SendSmtpEmailCtor();

  // Prepare recipients - zawsze z name z params.firstName
  if (typeof to === 'string') {
    mail.to = [{ email: to, name: params.firstName || 'Klient' }];
  } else if (Array.isArray(to)) {
    mail.to = to;
  } else if (to && typeof to === 'object') {
    mail.to = [to];
  } else {
    throw new Error('sendTemplate: invalid "to"');
  }

  // nadawca / reply-to
  mail.sender = { 
    email: senderEmail, 
    name: senderName || senderEmail 
  };
  if (replyToEmail) {
    mail.replyTo = { email: replyToEmail, name: senderName || replyToEmail };
  }

  // NIE ustawiaj htmlContent ani type. Używamy tylko templateId + params.
  mail.templateId = Number(templateId);
  mail.params = params; // Bezpośrednio params, bez zagnieżdżania

  if (tags && Array.isArray(tags)) {
    mail.tags = tags;
  }

  console.log('[brevoService] Sending template:', templateId, 'to:', to, 'params:', Object.keys(params));
  
  try {
    const res = await api.sendTransacEmail(mail);
    return res;
  } catch (err) {
    console.error('[brevoService] sendTemplate error:', err?.message || err);
    throw err;
  }
}

/**
 * Nakładka specyficznie do przypomnień zajęć.
 * Używa ENV: BREVO_TEMPLATE_ID, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME
 */
async function sendClassReminder({ toEmail, toName, params }) {
  return sendTemplate({
    to: { email: toEmail, name: toName },
    templateId: process.env.BREVO_TEMPLATE_ID,
    params,
    senderEmail: process.env.BREVO_SENDER_EMAIL,
    senderName: process.env.BREVO_SENDER_NAME,
    replyToEmail: process.env.BREVO_SENDER_EMAIL,
    tags: ['class-reminder', '1h-before']
  });
}

module.exports = {
  sendTemplate,
  sendClassReminder
};