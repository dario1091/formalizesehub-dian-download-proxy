import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { requireAuth, optionsResponse } from '../../../formalizesehub-auth/shared/auth-middleware/src/index';

const sqs = new SQSClient({});
const QUEUE_URL = process.env.SQS_DIAN_PROCESSING_URL!;

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const authResult = requireAuth(event);
  if (authResult.response) return authResult.response;
  const { auth } = authResult;

  try {
    const body = JSON.parse(event.body || '{}');
    const { pk, rk, tokenValue, fechaInicio, fechaFin, groupCode, clientId } = body;

    if (!pk || !rk || !tokenValue || !fechaInicio || !clientId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Faltan campos requeridos: pk, rk, tokenValue, fechaInicio, clientId' }) };
    }

    const sessionId = event.requestContext.requestId;
    // usuarioId siempre del token — nunca del body
    const message = { pk, rk, tokenValue, fechaInicio, fechaFin, groupCode, usuarioId: auth.userId, clientId, sessionId, created_by: auth.userId };

    await sqs.send(new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(message),
    }));

    return {
      statusCode: 202,
      headers,
      body: JSON.stringify({ message: 'Descarga iniciada. Recibirás una notificación cuando esté lista.', sessionId }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno al iniciar descarga' }) };
  }
};
