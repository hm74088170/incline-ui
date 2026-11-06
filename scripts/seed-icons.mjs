const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const KEY = process.env.ADMIN_API_KEY;

if (!KEY) {
  console.error("ADMIN_API_KEY missing. Run: node --env-file=.env.local scripts/seed-icons.mjs");
  process.exit(1);
}

const wrap = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const seed = {
  Arrows: {
    "Arrow Left": { tags: "direction,back", svg: '<path d="M19 12H5M12 19l-7-7 7-7"/>' },
    "Arrow Right": { tags: "direction,next", svg: '<path d="M5 12h14M12 5l7 7-7 7"/>' },
    "Arrow Up": { tags: "direction,top", svg: '<path d="M12 19V5M5 12l7-7 7 7"/>' },
    "Arrow Down": { tags: "direction,bottom", svg: '<path d="M12 5v14M19 12l-7 7-7-7"/>' },
  },
  Actions: {
    Plus: { tags: "add,new", svg: '<path d="M12 5v14M5 12h14"/>' },
    Check: { tags: "done,tick", svg: '<path d="M20 6L9 17l-5-5"/>' },
    Close: { tags: "x,cancel", svg: '<path d="M18 6L6 18M6 6l12 12"/>' },
    Search: { tags: "find,magnify", svg: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>' },
  },
};

const headers = { Authorization: `Bearer ${KEY}` };

async function ensureCategory(name) {
  const res = await fetch(`${BASE}/api/categories`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (res.status === 201) return (await res.json()).data.id;
  if (res.status === 409) {
    const list = await (await fetch(`${BASE}/api/categories`)).json();
    return list.data.find((c) => c.name === name).id;
  }
  throw new Error(`Category ${name}: ${res.status} ${await res.text()}`);
}

for (const [category, icons] of Object.entries(seed)) {
  const categoryId = await ensureCategory(category);
  for (const [name, { tags, svg }] of Object.entries(icons)) {
    const form = new FormData();
    form.set("name", name);
    form.set("categoryId", categoryId);
    form.set("tags", tags);
    form.set("file", new Blob([wrap(svg)], { type: "image/svg+xml" }), `${name}.svg`);

    const res = await fetch(`${BASE}/api/icons`, { method: "POST", headers, body: form });
    const label = res.status === 201 ? "uploaded" : res.status === 409 ? "exists  " : `FAILED ${res.status}`;
    console.log(label, name);
  }
}