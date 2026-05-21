# SPF y DMARC para madsjeez.com.ar

Los registros **SPF** y **DMARC** se configuran en el **DNS del dominio** (NIC Argentina / proveedor DNS), no en el código de Next.js. Sin ellos, auditorías SEO y filtros de correo marcan el dominio como incompleto.

## SPF (TXT en la raíz o subdominio de envío)

Ejemplo si enviás correo con **Google Workspace**:

```txt
v=spf1 include:_spf.google.com ~all
```

Ejemplo si usás **SendGrid / Mailgun / otro**:

```txt
v=spf1 include:sendgrid.net ~all
```

Consultá la documentación de tu proveedor de email transaccional y agregá un solo registro SPF (no dupliques varios TXT `v=spf1` en el mismo host).

## DMARC (TXT en `_dmarc.madsjeez.com.ar`)

Empezá en modo supervisión:

```txt
v=DMARC1; p=none; rua=mailto:dmarc@madsjeez.com.ar; fo=1
```

Cuando SPF/DKIM estén alineados, podés subir a `p=quarantine` o `p=reject`.

## DKIM

Activá DKIM en el panel del proveedor de correo (Google, SendGrid, etc.) y publicá el CNAME/TXT que indiquen.

## Verificación

- [MXToolbox SPF](https://mxtoolbox.com/spf.aspx)
- [MXToolbox DMARC](https://mxtoolbox.com/dmarc.aspx)

Tras publicar los registros, esperá propagación DNS (hasta 48 h) y volvé a correr la auditoría.
