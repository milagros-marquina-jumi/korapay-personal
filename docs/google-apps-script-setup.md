# Conectar un correo bancario con Google Apps Script

KoraPay importa tus consumos leyendo los correos que tu banco te envía. No usa Gmail OAuth
ni Google Cloud Console: instalas un pequeño script en cada Gmail que quieras conectar.

## Requisitos

- La cuenta Gmail donde llegan los correos del banco.
- El token de ingesta que KoraPay te muestra al crear la fuente de correo (se ve una sola vez).
- La URL de la API de KoraPay.

## Pasos (repetir en cada correo)

1. Entra al Gmail que vas a conectar.
2. Crea la etiqueta `KoraPay/Bancos`.
3. Crea un filtro que aplique esa etiqueta a los correos de tu banco. Ejemplos de filtro:
   - `from:(notificacionesbcp.com.pe OR interbank.pe OR bbva.pe)`
   - o por asunto: `subject:(compra OR consumo OR operación OR transferencia)`
   Empieza con filtros conservadores. No etiquetes promociones ni estados de cuenta.
4. En KoraPay ve a **Configuración → Integraciones → Correos bancarios → Agregar correo**.
   Elige el workspace por defecto para ese correo. Copia el **token** que aparece (solo se
   muestra una vez).
5. Abre https://script.google.com y crea un proyecto nuevo.
6. Pega el contenido de `tooling/google-apps-script/korapay-gmail-connector.gs`.
7. En el `CONFIG` del script cambia:
   - `apiUrl` y `testUrl` por la URL de tu API de KoraPay.
   - `sourceEmail` por el correo que estás conectando.
8. Abre **Configuración del proyecto → Propiedades del script** y crea una propiedad:
   - Nombre: `KORAPAY_INGESTION_TOKEN`
   - Valor: el token copiado.
9. Ejecuta la función `setupKoraPay` y autoriza el script cuando lo pida.
10. Ejecuta `testKoraPayConnection`. Debe registrar `HTTP 200` y `Conexión correcta`.
11. Ejecuta `createKoraPayTrigger` para que sincronice cada 15 minutos.
12. Verifica en **Activadores** que exista el trigger de `syncKoraPayBankEmails`.
13. Etiqueta o envía un correo bancario de prueba con `KoraPay/Bancos`.
14. Ejecuta `syncKoraPayBankEmails` manualmente.
15. Revisa **Movimientos → Detectados** en KoraPay: el consumo debe aparecer como
    "Por revisar".

## Conectar un segundo o tercer correo

Repite todos los pasos en el otro Gmail. Cada correo tiene su propio token y su propio
proyecto de Apps Script. KoraPay unifica los movimientos en una sola bandeja y detecta
duplicados entre correos.

## Seguridad

- El token vive solo en las Propiedades del script, nunca en el código.
- El script no envía adjuntos ni correos sin la etiqueta `KoraPay/Bancos`.
- Puedes **Pausar**, **Regenerar token** o **Eliminar** la fuente desde KoraPay en
  cualquier momento. Al regenerar, actualiza la propiedad del script con el nuevo token.
