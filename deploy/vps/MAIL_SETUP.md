# Transactional email on the VPS

The API sends a six-digit verification code during customer registration, verification and password reset messages, a welcome message after verification, and a security notice after a password change. Delivery uses SMTP. The VPS bootstrap intentionally leaves the SMTP credentials empty, so these messages are not delivered until a mail provider is configured.

1. Create or use a transactional email provider account and verify the sender domain/address. The repository's `.env.example` shows the Brevo SMTP host and port.
2. Connect to the VPS as `deploy` and edit the protected API environment file with `sudoedit /opt/baby-shop/.env.api`. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM_EMAIL`, and `MAIL_FROM_NAME`. Use the provider's SMTP credentials and a sender address/domain it has verified.
3. Recreate the API container to load the updated environment:

   ```sh
   cd /opt/baby-shop
   docker compose --env-file /opt/baby-shop/.env.api -f docker-compose.vps.yml up -d --no-deps --force-recreate api
   ```

4. Check `docker compose --env-file /opt/baby-shop/.env.api -f docker-compose.vps.yml logs --tail=100 api` for SMTP delivery errors. Never commit `.env.api` or paste SMTP credentials into chat.

The API keeps registration and forgot-password responses generic. A missing SMTP configuration does not reveal whether an email account exists; customers can use the resend-verification action after SMTP is configured.
