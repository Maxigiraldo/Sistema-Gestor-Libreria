import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('MAIL_HOST'),
      port: parseInt(this.config.get('MAIL_PORT') ?? '587'),
      secure: false,
      auth: {
        user: this.config.get('MAIL_USER'),
        pass: this.config.get('MAIL_PASS'),
      },
    });
  }

  async sendAdminWelcome(email: string, username: string, token: string) {
    const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:4200';
    const link = `${frontendUrl}/set-password?token=${token}`;

    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM') ?? 'Librería <no-reply@libreria.com>',
      to: email,
      subject: 'Bienvenido — Configura tu contraseña',
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px;border-left:4px solid #000">
          <h2 style="font-size:22px;font-weight:400;margin-bottom:8px">Hola, ${username}</h2>
          <p style="color:#4b5563;line-height:1.6">Has sido registrado como <strong>Administrador</strong> en la plataforma de la librería.</p>
          <p style="color:#4b5563;line-height:1.6">Para activar tu cuenta debes configurar tu contraseña haciendo clic en el siguiente enlace:</p>
          <a href="${link}"
             style="display:inline-block;margin:20px 0;padding:12px 24px;background:#000;color:#fff;text-decoration:none;font-size:13px;text-transform:uppercase;letter-spacing:.05em">
            Configurar contraseña
          </a>
          <p style="font-size:12px;color:#9ca3af">Este enlace expira en 48 horas. Si no solicitaste este acceso, ignora este correo.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:11px;color:#9ca3af">Librería — Sistema de gestión</p>
        </div>
      `,
    }).catch(err => {
      this.logger.error('Error enviando correo de bienvenida', err);
      throw err;
    });
  }
}
