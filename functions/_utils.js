export function escapeHtml(s=""){
  return String(s)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

export function jsonld(obj){
  return `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
}

export function okJson(data, init={}){
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type":"application/json; charset=utf-8", ...(init.headers||{}) }
  });
}
