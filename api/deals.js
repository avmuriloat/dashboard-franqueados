// Vercel Serverless Function — Proxy seguro para o Bitrix24
// O webhook fica guardado como variável de ambiente (BITRIX_WEBHOOK)
// O dashboard público nunca vê a URL secreta

export const config = { runtime: 'edge' };

export default async function handler(req) {
  // CORS — permite que o dashboard chame este endpoint
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const webhook = process.env.BITRIX_WEBHOOK;
  if (!webhook) {
    return new Response(JSON.stringify({ error: 'Webhook não configurado' }), {
      status: 500, headers: corsHeaders
    });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('category') || '40';

  // Busca todos os deals com paginação
  const allDeals = [];
  let start = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      const url = `${webhook}/crm.deal.list?filter[CATEGORY_ID]=${categoryId}&select[]=ID&select[]=TITLE&select[]=STAGE_ID&select[]=OPPORTUNITY&select[]=CONTACT_ID&select[]=DATE_CREATE&select[]=DATE_MODIFY&start=${start}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.result) allDeals.push(...data.result);
      if (data.next) start = data.next;
      else hasMore = false;
    }

    return new Response(JSON.stringify({ result: allDeals, total: allDeals.length }), {
      status: 200, headers: corsHeaders
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: corsHeaders
    });
  }
}
