function firstOr(values, fallback) {
  return values?.find(Boolean) || fallback;
}

export function generateDesignConcepts(analysis, results = []) {
  const motifs = (analysis?.motifs ?? []).filter(x => x.count > 0);
  const keywords = analysis?.strongestKeywords ?? [];
  const topTerms = (analysis?.topTerms ?? []).slice(0, 5).map(x => x.term);
  const primary = firstOr(motifs.map(x => x.name), "seasonal illustration");
  const keyword = firstOr(keywords, "halloween shirt");
  const priceBand = analysis?.medianPrice == null ? "market median not yet observed" : `observed median around $${analysis.medianPrice}`;

  const concepts = [
    {
      id: "hero-poster",
      name: "Midnight Harvest Poster",
      keyword,
      evidence: `Primary observed motif: ${primary}; ${priceBand}.`,
      visual: "Original Halloween night scene with one dominant seasonal character, oversized moon, restrained foliage and a hand-drawn poster frame.",
      layout: "Centered vertical poster composition with a clear silhouette and generous negative space.",
      palette: "3–5 ink colors: warm cream, charcoal, muted orange, deep green and one optional accent.",
      typography: "Small arched seasonal title plus compact supporting line; avoid stock-looking default fonts.",
      print: "Front print; works as a tee and sweatshirt graphic.",
      differentiation: "Invent new characters, wording, pose, scenery and framing; do not trace or reconstruct any sampled listing."
    },
    {
      id: "badge",
      name: "Spooky Club Badge",
      keyword: topTerms[0] ? `${topTerms[0]} ${keyword.replace(" shirt","")}`.trim() : keyword,
      evidence: `Recurring terms include: ${topTerms.join(", ") || "none yet"}.`,
      visual: "Original club/varsity-style emblem built around a seasonal icon, secondary symbols and a custom monogram.",
      layout: "Circular or shield badge with one central icon and two small supporting details.",
      palette: "2–4 ink colors with strong contrast for small thumbnail viewing.",
      typography: "Custom-feeling condensed collegiate lettering paired with a tiny secondary caption.",
      print: "Front chest badge or medium front print.",
      differentiation: "Create a new emblem system and wording; avoid copying recognizable school, sports or seller branding."
    },
    {
      id: "botanical",
      name: "Haunted Herbarium",
      keyword: keywords.find(x => /skeleton|botanical|flower|floral|ghost/i.test(x)) || keyword,
      evidence: "Tests the observed botanical/illustrative direction as a distinct composition rather than a replica.",
      visual: "Original seasonal subject surrounded by hand-drawn leaves, herbs and small specimen labels.",
      layout: "Tall herbarium plate with a dominant central subject and asymmetric botanical framing.",
      palette: "Muted cream, black, olive and one autumn accent; optional distressed texture.",
      typography: "Small serif specimen labels with one custom seasonal headline.",
      print: "Front print with optional small chest mark.",
      differentiation: "Use a newly composed specimen, plant arrangement, labels and illustration language."
    },
    {
      id: "backprint",
      name: "After Dark Back Print",
      keyword: keywords.find(x => /halloween|spooky|ghost|skeleton/i.test(x)) || keyword,
      evidence: "Designed as a thumbnail and back-print test against the observed seasonal graphic market.",
      visual: "Large original rear graphic: night sky, seasonal landmark, character cluster and a compact date/season lockup.",
      layout: "Small front chest mark + large rear poster composition.",
      palette: "3–5 colors with a dark garment-compatible silhouette.",
      typography: "Large curved title with small coordinates/date-style supporting text.",
      print: "Back print with minimal front mark.",
      differentiation: "New scene, characters, copy and composition; use no sampled artwork as a template."
    }
  ];

  return {
    generatedAt: new Date().toISOString(),
    count: concepts.length,
    concepts,
    guardrails: [
      "Concepts are generated from public market signals, not private competitor sales.",
      "Observed motifs guide direction only; artwork must be independently created.",
      "Before publishing, verify trademarks, copyrighted phrases, logos and recognizable characters.",
      "Use actual Printify costs and Etsy fees for the final margin decision."
    ]
  };
}
