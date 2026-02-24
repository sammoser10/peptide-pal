export interface CommonPeptide {
  name: string;
  aliases: string[];
  category: string;
  description: string;
  commonVialSizesMg: number[];
  typicalDoseMcg: { low: number; mid: number; high: number };
  typicalFrequency: string;
  reconstitutionNotes: string;
  goalTags: string[];
}

export const COMMON_PEPTIDES: CommonPeptide[] = [
  {
    name: "BPC-157",
    aliases: ["Body Protection Compound-157"],
    category: "Healing & Recovery",
    description: "A gastric pentadecapeptide known for tissue healing, gut repair, and injury recovery support.",
    commonVialSizesMg: [5, 10],
    typicalDoseMcg: { low: 200, mid: 500, high: 750 },
    typicalFrequency: "Once or twice daily",
    reconstitutionNotes: "Commonly reconstituted with 2mL BAC water for a 5mg vial, or 2-3mL for a 10mg vial.",
    goalTags: ["healing", "gut health", "injury recovery", "joint support", "tendon repair"],
  },
  {
    name: "TB-500",
    aliases: ["Thymosin Beta-4", "TB4"],
    category: "Healing & Recovery",
    description: "Promotes cell migration and wound healing. Often used alongside BPC-157 for enhanced recovery.",
    commonVialSizesMg: [2, 5, 10],
    typicalDoseMcg: { low: 2500, mid: 5000, high: 10000 },
    typicalFrequency: "Twice weekly",
    reconstitutionNotes: "Typically reconstituted with 2mL BAC water per 5mg vial.",
    goalTags: ["healing", "injury recovery", "flexibility", "tissue repair"],
  },
  {
    name: "Retatrutide",
    aliases: ["LY-3437943", "Reta"],
    category: "Weight Management",
    description: "A triple agonist (GLP-1/GIP/glucagon receptor) for weight management and metabolic health.",
    commonVialSizesMg: [5, 10, 15],
    typicalDoseMcg: { low: 1000, mid: 4000, high: 12000 },
    typicalFrequency: "Once weekly",
    reconstitutionNotes: "Reconstitute with 2mL BAC water for standard concentrations. Some prefer 1-1.5mL for smaller injection volumes.",
    goalTags: ["weight loss", "metabolic health", "appetite control", "fat loss", "body composition"],
  },
  {
    name: "Semaglutide",
    aliases: ["Ozempic", "Wegovy", "Sema"],
    category: "Weight Management",
    description: "A GLP-1 receptor agonist used for weight management and blood sugar regulation.",
    commonVialSizesMg: [3, 5, 10],
    typicalDoseMcg: { low: 250, mid: 1000, high: 2400 },
    typicalFrequency: "Once weekly",
    reconstitutionNotes: "Typically reconstituted with 2mL BAC water for a 5mg vial. Start at low doses and titrate up monthly.",
    goalTags: ["weight loss", "appetite control", "blood sugar", "metabolic health"],
  },
  {
    name: "Tirzepatide",
    aliases: ["Mounjaro", "Zepbound", "Tirz"],
    category: "Weight Management",
    description: "A dual GIP/GLP-1 receptor agonist for weight management and glycemic control.",
    commonVialSizesMg: [5, 10, 15, 30],
    typicalDoseMcg: { low: 2500, mid: 7500, high: 15000 },
    typicalFrequency: "Once weekly",
    reconstitutionNotes: "Reconstitute with 2mL BAC water per 10mg vial. Titrate dose every 4 weeks.",
    goalTags: ["weight loss", "appetite control", "blood sugar", "metabolic health", "body composition"],
  },
  {
    name: "CJC-1295 / Ipamorelin",
    aliases: ["CJC/Ipa", "CJC-1295 DAC", "CJC-1295 no DAC"],
    category: "Growth Hormone",
    description: "A GHRH analog combined with a ghrelin mimetic to stimulate natural growth hormone release.",
    commonVialSizesMg: [2, 5],
    typicalDoseMcg: { low: 100, mid: 200, high: 300 },
    typicalFrequency: "Once daily, typically before bed",
    reconstitutionNotes: "Reconstitute each vial with 2mL BAC water. Often supplied as a blend.",
    goalTags: ["muscle growth", "recovery", "anti-aging", "sleep quality", "fat loss"],
  },
  {
    name: "Ipamorelin",
    aliases: ["Ipa"],
    category: "Growth Hormone",
    description: "A selective growth hormone secretagogue that stimulates GH release without significant cortisol or prolactin increase.",
    commonVialSizesMg: [2, 5],
    typicalDoseMcg: { low: 100, mid: 200, high: 300 },
    typicalFrequency: "1-3 times daily",
    reconstitutionNotes: "Reconstitute with 2mL BAC water per 5mg vial.",
    goalTags: ["muscle growth", "recovery", "anti-aging", "sleep quality", "fat loss"],
  },
  {
    name: "Tesamorelin",
    aliases: ["Egrifta"],
    category: "Growth Hormone",
    description: "A GHRH analog that stimulates growth hormone production. Known for reducing visceral fat.",
    commonVialSizesMg: [2, 5],
    typicalDoseMcg: { low: 1000, mid: 2000, high: 2000 },
    typicalFrequency: "Once daily",
    reconstitutionNotes: "Reconstitute with 2mL BAC water per 2mg vial.",
    goalTags: ["fat loss", "visceral fat reduction", "anti-aging", "body composition"],
  },
  {
    name: "MK-677",
    aliases: ["Ibutamoren", "Nutrobal"],
    category: "Growth Hormone",
    description: "An oral growth hormone secretagogue that increases GH and IGF-1 levels.",
    commonVialSizesMg: [],
    typicalDoseMcg: { low: 10000, mid: 25000, high: 25000 },
    typicalFrequency: "Once daily (oral)",
    reconstitutionNotes: "Typically available as an oral capsule or liquid. No reconstitution needed.",
    goalTags: ["muscle growth", "appetite increase", "sleep quality", "recovery"],
  },
  {
    name: "PT-141",
    aliases: ["Bremelanotide"],
    category: "Sexual Health",
    description: "A melanocortin receptor agonist used for sexual health and libido enhancement.",
    commonVialSizesMg: [2, 10],
    typicalDoseMcg: { low: 500, mid: 1000, high: 2000 },
    typicalFrequency: "As needed, 45 minutes before activity",
    reconstitutionNotes: "Reconstitute with 2mL BAC water per 10mg vial.",
    goalTags: ["sexual health", "libido", "arousal"],
  },
  {
    name: "Melanotan II",
    aliases: ["MT-2", "MT2", "Melanotan 2"],
    category: "Skin & Tanning",
    description: "A synthetic melanocortin peptide that stimulates melanogenesis for skin tanning.",
    commonVialSizesMg: [10],
    typicalDoseMcg: { low: 100, mid: 250, high: 500 },
    typicalFrequency: "Daily during loading, then maintenance 1-2x weekly",
    reconstitutionNotes: "Reconstitute with 2mL BAC water per 10mg vial.",
    goalTags: ["tanning", "skin pigmentation", "libido"],
  },
  {
    name: "GHK-Cu",
    aliases: ["Copper Peptide", "GHK Copper"],
    category: "Anti-Aging & Skin",
    description: "A copper peptide complex that promotes collagen synthesis, wound healing, and skin rejuvenation.",
    commonVialSizesMg: [5, 50],
    typicalDoseMcg: { low: 200, mid: 500, high: 1000 },
    typicalFrequency: "Once daily",
    reconstitutionNotes: "For injectable, reconstitute with 2mL BAC water per 5mg vial. Also available as topical.",
    goalTags: ["anti-aging", "skin health", "collagen", "wound healing", "hair growth"],
  },
  {
    name: "Epithalon",
    aliases: ["Epitalon", "Epithalamin"],
    category: "Anti-Aging",
    description: "A tetrapeptide that may support telomere maintenance and regulate the pineal gland's melatonin production.",
    commonVialSizesMg: [10, 50],
    typicalDoseMcg: { low: 5000, mid: 10000, high: 10000 },
    typicalFrequency: "Once daily for 10-20 day cycles",
    reconstitutionNotes: "Reconstitute with 2mL BAC water per 10mg vial.",
    goalTags: ["anti-aging", "longevity", "sleep quality", "telomere support"],
  },
  {
    name: "DSIP",
    aliases: ["Delta Sleep-Inducing Peptide"],
    category: "Sleep",
    description: "A neuropeptide that promotes deep, restorative sleep without sedative effects.",
    commonVialSizesMg: [2, 5],
    typicalDoseMcg: { low: 100, mid: 200, high: 300 },
    typicalFrequency: "Once daily before bed",
    reconstitutionNotes: "Reconstitute with 2mL BAC water per 5mg vial.",
    goalTags: ["sleep quality", "recovery", "stress reduction"],
  },
  {
    name: "Selank",
    aliases: [],
    category: "Cognitive & Mood",
    description: "A synthetic peptide with anxiolytic and nootropic properties. Supports mood and cognitive function.",
    commonVialSizesMg: [5],
    typicalDoseMcg: { low: 200, mid: 400, high: 750 },
    typicalFrequency: "1-3 times daily (nasal or subcutaneous)",
    reconstitutionNotes: "For injectable, reconstitute with 2mL BAC water. Also available as nasal spray.",
    goalTags: ["anxiety relief", "cognitive enhancement", "mood", "focus"],
  },
  {
    name: "Semax",
    aliases: [],
    category: "Cognitive & Mood",
    description: "A neuropeptide with nootropic, neuroprotective, and cognitive-enhancing properties.",
    commonVialSizesMg: [3, 5],
    typicalDoseMcg: { low: 200, mid: 600, high: 1000 },
    typicalFrequency: "1-2 times daily (nasal or subcutaneous)",
    reconstitutionNotes: "Most commonly used as a nasal spray. Injectable form reconstituted with 2mL BAC water.",
    goalTags: ["cognitive enhancement", "focus", "neuroprotection", "mood"],
  },
  {
    name: "NAD+",
    aliases: ["Nicotinamide Adenine Dinucleotide"],
    category: "Anti-Aging & Energy",
    description: "A coenzyme essential for cellular energy production and DNA repair.",
    commonVialSizesMg: [100, 250, 500],
    typicalDoseMcg: { low: 50000, mid: 100000, high: 250000 },
    typicalFrequency: "1-3 times weekly",
    reconstitutionNotes: "Reconstitute with 10mL BAC water per 500mg vial for subcutaneous use. Slow injection recommended.",
    goalTags: ["energy", "anti-aging", "cellular health", "recovery", "longevity"],
  },
  {
    name: "AOD-9604",
    aliases: ["Anti-Obesity Drug 9604"],
    category: "Weight Management",
    description: "A modified fragment of human growth hormone (HGH frag 176-191) that targets fat metabolism.",
    commonVialSizesMg: [2, 5],
    typicalDoseMcg: { low: 250, mid: 300, high: 500 },
    typicalFrequency: "Once daily on an empty stomach",
    reconstitutionNotes: "Reconstitute with 2mL BAC water per 5mg vial.",
    goalTags: ["fat loss", "body composition", "metabolism"],
  },
  {
    name: "Kisspeptin-10",
    aliases: ["KP-10"],
    category: "Hormonal Health",
    description: "A peptide that stimulates gonadotropin-releasing hormone, supporting natural testosterone and hormonal balance.",
    commonVialSizesMg: [2, 5],
    typicalDoseMcg: { low: 100, mid: 200, high: 400 },
    typicalFrequency: "Once daily or as directed",
    reconstitutionNotes: "Reconstitute with 2mL BAC water per 5mg vial.",
    goalTags: ["testosterone support", "hormonal balance", "fertility"],
  },
  {
    name: "SS-31",
    aliases: ["Elamipretide", "Bendavia"],
    category: "Mitochondrial Health",
    description: "A mitochondria-targeted peptide that improves cellular energy production and reduces oxidative stress.",
    commonVialSizesMg: [5, 50],
    typicalDoseMcg: { low: 500, mid: 1000, high: 2000 },
    typicalFrequency: "Once daily",
    reconstitutionNotes: "Reconstitute with 2mL BAC water per 5mg vial.",
    goalTags: ["energy", "mitochondrial health", "anti-aging", "exercise performance"],
  },
  {
    name: "LL-37",
    aliases: ["Cathelicidin"],
    category: "Immune Support",
    description: "An antimicrobial peptide that supports immune defense and helps manage biofilm-related conditions.",
    commonVialSizesMg: [5],
    typicalDoseMcg: { low: 50, mid: 100, high: 200 },
    typicalFrequency: "Once daily or every other day",
    reconstitutionNotes: "Reconstitute with 2mL BAC water per 5mg vial. Can also be nebulized.",
    goalTags: ["immune support", "antimicrobial", "gut health", "biofilm"],
  },
  {
    name: "Thymosin Alpha-1",
    aliases: ["Ta1", "Zadaxin"],
    category: "Immune Support",
    description: "A thymic peptide that modulates immune function and enhances T-cell activity.",
    commonVialSizesMg: [3, 5],
    typicalDoseMcg: { low: 750, mid: 1500, high: 3000 },
    typicalFrequency: "2-3 times weekly",
    reconstitutionNotes: "Reconstitute with 1-2mL BAC water per vial.",
    goalTags: ["immune support", "immune modulation", "chronic illness support"],
  },
  {
    name: "MOTS-c",
    aliases: ["Mitochondrial ORF of the 12S rRNA Type-C"],
    category: "Metabolic Health",
    description: "A mitochondrial-derived peptide that supports metabolic regulation and exercise capacity.",
    commonVialSizesMg: [5, 10],
    typicalDoseMcg: { low: 5000, mid: 10000, high: 15000 },
    typicalFrequency: "3-5 times weekly",
    reconstitutionNotes: "Reconstitute with 2mL BAC water per 5mg vial.",
    goalTags: ["metabolic health", "exercise performance", "fat loss", "insulin sensitivity"],
  },
  {
    name: "Pentosan Polysulfate",
    aliases: ["PPS", "Cartrophen", "Elmiron"],
    category: "Joint Health",
    description: "A semi-synthetic polysaccharide used for joint health, cartilage protection, and bladder conditions.",
    commonVialSizesMg: [250],
    typicalDoseMcg: { low: 2000, mid: 3000, high: 3000 },
    typicalFrequency: "Once weekly",
    reconstitutionNotes: "Typically supplied as a pre-mixed injectable solution. No reconstitution needed.",
    goalTags: ["joint health", "cartilage repair", "osteoarthritis", "bladder health"],
  },
  {
    name: "Oxytocin",
    aliases: [],
    category: "Hormonal Health",
    description: "Known as the 'bonding hormone', supports social connection, mood, and stress management.",
    commonVialSizesMg: [],
    typicalDoseMcg: { low: 10, mid: 24, high: 40 },
    typicalFrequency: "As needed (nasal spray)",
    reconstitutionNotes: "Typically supplied as a pre-made nasal spray. Follow compounding pharmacy instructions.",
    goalTags: ["mood", "social bonding", "stress reduction", "anxiety relief"],
  },
];

/**
 * Search peptides by name, aliases, category, or goal tags.
 */
export function searchPeptides(query: string): CommonPeptide[] {
  if (!query.trim()) return COMMON_PEPTIDES;

  const q = query.toLowerCase().trim();
  return COMMON_PEPTIDES.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.aliases.some((a) => a.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      p.goalTags.some((t) => t.toLowerCase().includes(q))
  );
}

/**
 * Get unique categories from the peptide database.
 */
export function getPeptideCategories(): string[] {
  return [...new Set(COMMON_PEPTIDES.map((p) => p.category))];
}
