function firstOr(values, fallback) {
  return values?.find(Boolean) || fallback;
}

export function generateDesignConcepts(analysis, results = []) {
  // This layer produces structured briefs. Image generation is intentionally
  // provider-agnostic so the project can use the connected image tool later.

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
      differentiation: "Invent new characters, wording, pose, scenery and framing; do not trace or reconstruct any sampled listing.",
      imagePrompt: "Create an original screen-print-ready Halloween t-shirt graphic: midnight harvest poster, one friendly ghost character in a moonlit pumpkin field, hand-drawn vintage print texture, 3-5 ink colors, strong silhouette, centered vertical composition, no mockup, transparent background, clean edges, original lettering reading \"MIDNIGHT HARVEST\" only.",
      negativePrompt: "No brand logos, no copyrighted characters, no celebrity likeness, no photorealistic shirt mockup, no watermark, no extra text, no copied artwork, no gradients that reduce screen-print clarity.",
      printSpecs: "4500x5400 px master preferred, transparent background, 300 DPI, separate text-safe and artwork-safe zones, keep fine details above practical screen-print minimums."
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
      differentiation: "Create a new emblem system and wording; avoid copying recognizable school, sports or seller branding.",
      imagePrompt: "Create an original Halloween collegiate-style badge t-shirt graphic with a central seasonal icon, custom emblem geometry, two small supporting symbols and original lettering, 2-4 ink colors, bold thumbnail-friendly silhouette, transparent background, no mockup.",
      negativePrompt: "No real school logos, team marks, brand names, copyrighted characters, watermark, copied badge, or extra text.",
      printSpecs: "4500x5400 px master preferred, transparent background, 300 DPI, bold shapes and readable type at thumbnail size."
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
      differentiation: "Use a newly composed specimen, plant arrangement, labels and illustration language.",
      imagePrompt: "Create an original haunted herbarium Halloween t-shirt graphic: one seasonal central subject surrounded by hand-drawn leaves, herbs and specimen labels, muted cream black olive and one autumn accent, vintage botanical print feel, asymmetric tall composition, transparent background, no mockup.",
      negativePrompt: "No copyrighted illustrations, logos, recognizable character franchises, watermark, photo mockup, or copied specimen layout.",
      printSpecs: "4500x5400 px master preferred, transparent background, 300 DPI, preserve open negative space and avoid hairline details."
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
      differentiation: "New scene, characters, copy and composition; use no sampled artwork as a template.",
      imagePrompt: "Create an original Halloween back-print t-shirt graphic: moonlit seasonal landmark, small character cluster and a custom curved title, 3-5 ink colors, dark-garment compatible, strong poster hierarchy, transparent background, no mockup.",
      negativePrompt: "No copied scene, copyrighted characters, logos, watermark, photorealistic shirt mockup, or extra text beyond the custom title.",
      printSpecs: "4500x5400 px master preferred, transparent background, 300 DPI, optimized for a large back print."
    }
  ];

  concepts.push(
    {
      id: "pet-spooky",
      name: "Spooky Companion Club",
      keyword: keywords.find(x => /dog|cat|pet/i.test(x)) || "halloween pet shirt",
      evidence: "Tests the pet-seasonal demand lane with a newly illustrated companion character and custom club system.",
      visual: "Original friendly black cat or dog character with a tiny pumpkin, crescent moon and seasonal badge details.",
      layout: "Centered character with compact circular badge framing and generous negative space.",
      palette: "3-4 ink colors: cream, charcoal, muted orange and one cool accent.",
      typography: "Short custom club name with a small secondary seasonal caption.",
      print: "Front medium graphic designed for everyday unisex tees.",
      differentiation: "Create a completely new animal pose, facial expression, badge geometry and wording; no existing pet-shirt artwork is used as a template.",
      imagePrompt: "Create an original Halloween pet t-shirt graphic featuring a charming black cat or small dog companion, tiny pumpkin, crescent moon and custom circular club badge, hand-drawn vintage screen-print aesthetic, 3-4 ink colors, transparent background, clean bold shapes, no mockup.",
      negativePrompt: "No real pet photos, copyrighted characters, brand logos, copied pet-shirt layouts, watermark, mockup, or extra text beyond the custom club title.",
      printSpecs: "4500x5400 px master preferred, transparent background, 300 DPI, bold outlines and print-safe detail density."
    },
    {
      id: "retro-fall",
      name: "Retro Harvest Motel",
      keyword: keywords.find(x => /retro|fall|vintage/i.test(x)) || "retro halloween shirt",
      evidence: "Tests the recurring retro/fall vocabulary with a new illustrated roadside-poster concept.",
      visual: "Original roadside motel sign, moon, pumpkins and autumn landscape rendered as a distressed 1970s-inspired poster.",
      layout: "Wide stacked poster with one dominant sign and compact landscape silhouette.",
      palette: "Warm cream, rust orange, dark brown, olive and muted sky blue.",
      typography: "Custom retro display lettering with a small location-style caption.",
      print: "Front large graphic or sweatshirt-compatible print.",
      differentiation: "Invent a fictional place name, landscape, sign geometry and illustration from scratch.",
      imagePrompt: "Create an original retro Halloween fall t-shirt graphic showing a fictional roadside motel sign under a crescent moon, pumpkins and an autumn landscape, 1970s screen-print poster aesthetic, distressed but clean print texture, 4-5 ink colors, transparent background, no mockup.",
      negativePrompt: "No real motel logos, brands, copyrighted characters, copied vintage poster, watermark, photorealistic mockup, or extra text beyond the fictional sign name.",
      printSpecs: "4500x5400 px master preferred, transparent background, 300 DPI, keep distressed texture controlled for DTG readability."
    }
  );

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
