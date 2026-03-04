import nodemailer from 'nodemailer';

/**
 * Servizio Email per invio notifiche Domini in Scadenza
 * 
 * Configurazione richiesta in .env.local:
 * EMAIL_HOST=smtp.gmail.com
 * EMAIL_PORT=587
 * EMAIL_USER=hoonweb2022@gmail.com
 * EMAIL_PASS=your_app_password_here (Gmail App Password)
 * EMAIL_FROM=hoonweb2022@gmail.com
 * EMAIL_ALERT_TO=hoonweb2022@gmail.com
 */

// Crea transporter per invio email
const createTransporter = () => {
  // Fallback a valori di default se non configurato
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true per 465, false per altre porte
    auth: {
      user: process.env.EMAIL_USER || 'hoonweb2022@gmail.com',
      pass: process.env.EMAIL_PASS || ''
    }
  };

  // Se non c'è password configurata, logga warning
  if (!process.env.EMAIL_PASS) {
    console.warn('⚠️  EMAIL_PASS non configurata in .env.local - Le email non verranno inviate!');
    return null;
  }

  return nodemailer.createTransport(config);
};

/**
 * Invia email di alert per dominio in scadenza
 * @param {Object} notifica - Dati della notifica
 * @returns {Promise<Object>} Risultato invio
 */
export async function inviaEmailDominioScadenza(notifica) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('📧 EMAIL_PASS non configurata - Simulazione invio email');
      return {
        success: false,
        message: 'Email service not configured',
        simulated: true
      };
    }

    const emailTo = process.env.EMAIL_ALERT_TO || 'hoonweb2022@gmail.com';
    const emailFrom = process.env.EMAIL_FROM || 'hoonweb2022@gmail.com';

    // Template HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: bold; color: #6b7280; }
          .info-value { color: #111827; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-radius: 0 0 10px 10px; }
          .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; }
          .badge-warning { background: #fef3c7; color: #92400e; }
          .badge-danger { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Alert Scadenza Dominio</h1>
          </div>
          
          <div class="content">
            <div class="alert-box">
              <strong>⚠️ ATTENZIONE:</strong> Un dominio web sta per scadere e richiede il rinnovo!
            </div>
            
            <h2 style="color: #111827; margin-top: 30px;">Dettagli Dominio</h2>
            
            <div class="info-row">
              <span class="info-label">Cliente:</span>
              <span class="info-value">${notifica.cliente}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Dominio:</span>
              <span class="info-value"><strong>${notifica.dominio}</strong></span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Web Designer:</span>
              <span class="info-value">${notifica.webDesigner}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Data Scadenza:</span>
              <span class="info-value">${new Date(notifica.dataScadenza).toLocaleDateString('it-IT', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">Giorni Mancanti:</span>
              <span class="info-value">
                <span class="badge ${notifica.giorniMancanti <= 7 ? 'badge-danger' : 'badge-warning'}">
                  ${notifica.giorniMancanti} giorni
                </span>
              </span>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #111827;">📋 Azioni Richieste</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Contattare il cliente per conferma rinnovo</li>
                <li>Verificare i dati di fatturazione</li>
                <li>Procedere con il rinnovo del dominio</li>
                <li>Aggiornare la data nel gestionale dopo il rinnovo</li>
              </ul>
            </div>
            
            ${notifica.destinatari && notifica.destinatari.length > 0 ? `
            <div style="margin-top: 20px; font-size: 12px; color: #6b7280;">
              <strong>Notificato a:</strong> ${notifica.destinatari.map(d => d.nome).join(', ')}
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Questa è una notifica automatica dal sistema di Gestione Domini Hoon Web.</p>
            <p>Per maggiori informazioni, accedi al gestionale: <a href="http://localhost:3000/Gestione-Domini">Gestione Domini</a></p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} Hoon Web - Tutti i diritti riservati</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Opzioni email
    const mailOptions = {
      from: `"Hoon Web - Alert Domini" <${emailFrom}>`,
      to: emailTo,
      subject: `🚨 ALERT: Dominio in scadenza - ${notifica.cliente} (${notifica.giorniMancanti} giorni)`,
      html: htmlContent,
      text: `
ALERT SCADENZA DOMINIO

Cliente: ${notifica.cliente}
Dominio: ${notifica.dominio}
Web Designer: ${notifica.webDesigner}
Data Scadenza: ${new Date(notifica.dataScadenza).toLocaleDateString('it-IT')}
Giorni Mancanti: ${notifica.giorniMancanti}

AZIONI RICHIESTE:
- Contattare il cliente per conferma rinnovo
- Verificare i dati di fatturazione
- Procedere con il rinnovo del dominio
- Aggiornare la data nel gestionale dopo il rinnovo

---
Notifica automatica - Hoon Web
      `
    };

    // Invia email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email inviata con successo per ${notifica.cliente} - MessageID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      destinatario: emailTo
    };

  } catch (error) {
    console.error('❌ Errore invio email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Invia riepilogo multipli domini in scadenza
 * @param {Array} notifiche - Array di notifiche
 * @returns {Promise<Object>} Risultato invio
 */
export async function inviaEmailRiepilogoDomini(notifiche) {
  if (!notifiche || notifiche.length === 0) {
    return { success: false, message: 'Nessuna notifica da inviare' };
  }

  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('📧 EMAIL_PASS non configurata - Simulazione invio email');
      return {
        success: false,
        message: 'Email service not configured',
        simulated: true
      };
    }

    const emailTo = process.env.EMAIL_ALERT_TO || 'hoonweb2022@gmail.com';
    const emailFrom = process.env.EMAIL_FROM || 'hoonweb2022@gmail.com';

    // Ordina per giorni mancanti (più urgenti prima)
    const notificheOrdinate = [...notifiche].sort((a, b) => a.giorniMancanti - b.giorniMancanti);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
          .domain-card { background: #fff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 15px 0; }
          .domain-card.urgent { border-color: #dc2626; background: #fef2f2; }
          .domain-card.warning { border-color: #f59e0b; background: #fffbeb; }
          .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-danger { background: #dc2626; color: white; }
          .badge-warning { background: #f59e0b; color: white; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          td { padding: 8px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Riepilogo Domini in Scadenza</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">${notifiche.length} ${notifiche.length === 1 ? 'dominio richiede' : 'domini richiedono'} attenzione</p>
          </div>
          
          <div class="content">
            ${notificheOrdinate.map(notifica => `
              <div class="domain-card ${notifica.giorniMancanti <= 7 ? 'urgent' : 'warning'}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                  <h3 style="margin: 0; color: #111827;">${notifica.cliente}</h3>
                  <span class="badge ${notifica.giorniMancanti <= 7 ? 'badge-danger' : 'badge-warning'}">
                    ${notifica.giorniMancanti} giorni
                  </span>
                </div>
                <table>
                  <tr>
                    <td style="width: 150px; color: #6b7280;"><strong>Dominio:</strong></td>
                    <td style="color: #111827;"><strong>${notifica.dominio}</strong></td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280;"><strong>Web Designer:</strong></td>
                    <td style="color: #111827;">${notifica.webDesigner}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280;"><strong>Scadenza:</strong></td>
                    <td style="color: #111827;">${new Date(notifica.dataScadenza).toLocaleDateString('it-IT')}</td>
                  </tr>
                </table>
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>Notifica automatica - Hoon Web</p>
            <p>Accedi al gestionale: <a href="http://localhost:3000/Gestione-Domini">Gestione Domini</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Hoon Web - Alert Domini" <${emailFrom}>`,
      to: emailTo,
      subject: `🚨 RIEPILOGO: ${notifiche.length} domini in scadenza - Azione richiesta`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email riepilogo inviata con successo - ${notifiche.length} domini - MessageID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      count: notifiche.length
    };

  } catch (error) {
    console.error('❌ Errore invio email riepilogo:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
