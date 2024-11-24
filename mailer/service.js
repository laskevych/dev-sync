import ejs from 'ejs';
import nodemailer from 'nodemailer'
import { fileURLToPath } from 'url';
import * as path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @param {string} email
 * @param {Object} data
 * @return {Promise<void>}
 */
export async function sendPasswordReset(email, data) {
    await send(email, '[DevSync] Password Reset', 'passwordReset.html', data);
}

/**
 * @param {string} email
 * @param {Object} data
 * @return {Promise<void>}
 */
export async function sendConfirm(email, data) {
    await send(email, '[DevSync] Confirm Email', 'confirmEmail.html', data);
}

/**
 * @param {string} email
 * @param {string} subject
 * @param {string} htmlTemplate
 * @param {Object} dataForTemplate
 * @return {Promise<void>}
 */
async function send(email, subject, htmlTemplate, dataForTemplate) {
    try {
        const transport = nodemailer.createTransport(
            {
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: { user: process.env.ETHEREAL_LOGIN || 'martina.parisian90@ethereal.email', pass: process.env.ETHEREAL_PASSWORD || '6WmrYJ3bGkDqx3jWxq' }
            }
        );

        const html = await ejs.renderFile(path.join(__dirname, htmlTemplate), dataForTemplate);
        const result = await transport.sendMail(
            {
                from: "\"DevSync\" no-reply@devsync.com",
                to: email,
                subject,
                html
            }
        );
        console.log('Success. ' + result.response);
    } catch (error) {
        console.error('Error. ', error);
    }
}