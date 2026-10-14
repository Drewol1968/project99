const channels=[["TikTok","tiktok"],["Instagram","instagram"],["Facebook","facebook"],["WhatsApp","whatsapp"],["YouTube","youtube"]];
const list=document.getElementById("promoList");
for(const [label,source] of channels){
  const u=new URL("https://project99.appforge99.com/");
  u.searchParams.set("utm_source",source);
  u.searchParams.set("utm_medium","social");
  u.searchParams.set("utm_campaign","launch");
  const wrap=document.createElement("div");
  wrap.style.margin="10px 0";
  const b=document.createElement("button");
  b.className="primary-btn";
  b.textContent="KOPIUJ LINK — "+label;
  b.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(u.toString());b.textContent="SKOPIOWANO ✓ — "+label;setTimeout(()=>b.textContent="KOPIUJ LINK — "+label,1400);}catch(e){location.href=u.toString();}});
  wrap.appendChild(b); list.appendChild(wrap);
}