# FormalizeSE Hub - DIAN Download Proxy

Lambda proxy que recibe requests de API Gateway y los publica en SQS para procesamiento asíncrono.

## Descripción

Esta Lambda actúa como proxy entre API Gateway y la cola SQS de procesamiento DIAN:

1. Recibe `POST /dian/download` desde API Gateway
2. Valida los campos requeridos
3. Publica el mensaje en `DianProcessingQueue`
4. Responde inmediatamente con `202 Accepted`

## Arquitectura

```
Cliente → API Gateway → Lambda (proxy) → SQS (DianProcessingQueue)
                              ↓
                        202 Accepted
```

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `SQS_DIAN_PROCESSING_URL` | URL de la cola SQS para procesamiento DIAN |

## Request

```json
POST /dian/download
{
  "pk": "pk-del-token-dian",
  "rk": "rk-del-token-dian",
  "tokenValue": "token-uuid",
  "fechaInicio": "03/21/2026",
  "fechaFin": "03/22/2026",
  "groupCode": "2",
  "clientId": "cliente-id",
  "usuarioId": "usuario-id"
}
```

## Response

```json
HTTP 202 Accepted
{
  "message": "Descarga iniciada. Recibirás una notificación cuando esté lista.",
  "sessionId": "request-id-generado"
}
```

## Scripts

```bash
# Instalar dependencias
npm install

# Build
npm run build
```
