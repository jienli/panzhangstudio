// All site content lives here. To add a painting: list its photo in tools/images.json,
// run `python tools/prepare.py <id>` (writes images/<id>.jpg and <id>-sm.jpg), then add
// an entry to WORKS. Leave a field as null if it's unknown — the page shows "to be added".
// Titles and notes marked as placeholders are drafts for the artist to correct.

const SITE = {
  // Address that receives inquiries. Leave empty to hide the contact links.
  contactEmail: "",
};

const CATEGORIES = {
  flowers:     { en: "Flowers",     zh: "花卉" },
  landscape:   { en: "Landscape",   zh: "山水" },
  calligraphy: { en: "Calligraphy", zh: "书法" },
};

const COLOR_ON_PAPER = { en: "Ink and color on xuan paper", zh: "纸本设色" };
const INK_ON_PAPER = { en: "Ink on xuan paper", zh: "纸本水墨" };
const STUDY_NOTE = {
  en: "One of two paintings of the same composition, painted as studies of a classic arrangement.",
  zh: "同一构图的两幅习作之一。",
};

const img = (id) => ({ image: `images/${id}.jpg`, thumb: `images/${id}-sm.jpg` });

const WORKS = [
  {
    id: "flowers-in-season-2", ...img("flowers-in-season-2"),
    category: "flowers",
    title: { en: "When the Flowers Bloom, No. 2", zh: "花开时节 · 其二" },
    date: "2026-09",
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "Peonies and a bee beside a weathered rock, titled 花开时节 by the artist. " + STUDY_NOTE.en,
      zh: "牡丹、蜜蜂与苍石，画家自题“花开时节”。" + STUDY_NOTE.zh,
    },
  },
  {
    id: "flowers-in-season-1", ...img("flowers-in-season-1"),
    category: "flowers",
    title: { en: "When the Flowers Bloom, No. 1", zh: "花开时节 · 其一" },
    date: null,
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "Peonies in three shades of pink rising beside a broad ink rock. " + STUDY_NOTE.en,
      zh: "深浅三色牡丹依傍水墨巨石而开。" + STUDY_NOTE.zh,
    },
  },
  {
    id: "peerless-beauty-1", ...img("peerless-beauty-1"),
    category: "flowers",
    title: { en: "Peerless Beauty, No. 1", zh: "天下无双艳 · 其一" },
    date: "2026",
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "Crimson peonies hanging from a long branch, with two moths below. Inscribed with a classical couplet praising the peony as the loveliest flower under heaven, and dated 丙午七月 (the seventh lunar month of 2026). " + STUDY_NOTE.en,
      zh: "长枝垂挂绯红牡丹，下有双蛾。题古人咏牡丹联句，款署丙午七月。" + STUDY_NOTE.zh,
    },
  },
  {
    id: "peerless-beauty-2", ...img("peerless-beauty-2"),
    category: "flowers",
    title: { en: "Peerless Beauty, No. 2", zh: "天下无双艳 · 其二" },
    date: null,
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "The same hanging branch of peonies, left without an inscription. " + STUDY_NOTE.en,
      zh: "同一垂枝牡丹构图，未题款。" + STUDY_NOTE.zh,
    },
  },
  {
    id: "luoshen-peony", ...img("luoshen-peony"),
    category: "flowers",
    featured: true,
    title: { en: "Luoshen Peony", zh: "洛神" },
    date: null,
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "Luoshen, the Goddess of the Luo River, is the name of a prized peony variety. A single bloom with two red buds above an old, twisting stem.",
      zh: "“洛神”为名贵牡丹品种之名。一朵盛开，两颗红蕾，老干虬曲。",
    },
  },
  {
    id: "crimson-peony", ...img("crimson-peony"),
    category: "flowers",
    title: { en: "Crimson Peony", zh: "红牡丹" },
    date: null,
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "A large crimson peony bending on its stem toward a single bud, the petals shaded from deep red to almost white.",
      zh: "一朵绯红牡丹垂首俯向花蕾，花瓣由深红渐至近白。",
    },
  },
  {
    id: "spring-everywhere", ...img("spring-everywhere"),
    category: "flowers",
    title: { en: "Spring Everywhere", zh: "春意盎然" },
    date: null,
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "Peonies in warm orange and russet with blue-green leaves, titled 春意盎然 by the artist.",
      zh: "橙赭色牡丹配以青绿叶，画家自题“春意盎然”。",
    },
  },
  {
    id: "red-plum", ...img("red-plum"),
    category: "flowers",
    title: { en: "Red Plum Blossoms", zh: "红梅" },
    date: null,
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "A dark, twisting plum branch scattered with red and coral blossoms.",
      zh: "墨色梅枝曲折，点缀朱红与浅橘梅花。",
    },
  },
  {
    id: "winter-plum", ...img("winter-plum"),
    category: "flowers",
    title: { en: "Winter Plum", zh: "寒梅" },
    date: null,
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "A tall, narrow plum: a heavy ink trunk with fine branches of pale pink blossom reaching upward.",
      zh: "竖幅梅花，浓墨老干，细枝粉梅向上舒展。",
    },
  },
  {
    id: "a-branch-of-spring", ...img("a-branch-of-spring"),
    category: "flowers",
    title: { en: "A Branch of Spring", zh: "一枝春" },
    date: null,
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "A single shoot of red plum blossom rising from a broad, dry-brush branch.",
      zh: "一枝红梅自枯笔横干上挺然而出。",
    },
  },
  {
    id: "bamboo-branch-song", ...img("bamboo-branch-song"),
    category: "calligraphy",
    title: { en: "Bamboo Branch Song", zh: "竹枝词" },
    date: "2025-06-15",
    medium: INK_ON_PAPER, size: null,
    note: {
      en: "Liu Yuxi's Tang-dynasty poem in running script: willows by a calm river, a song from the water, sun in the east and rain in the west. Signed, dated and sealed by the artist.",
      zh: "行书录唐代刘禹锡《竹枝词》。画家署名、纪年并钤印。",
    },
  },
  {
    id: "peony-2024", ...img("peony-2024"),
    framed: "images/peony-2024-framed.jpg",
    category: "flowers",
    title: { en: "Peony", zh: "牡丹" },
    date: "2024-09-22",
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "Two peonies in soft violet, their leaves set down in a few bold strokes of ink. Titled, signed and sealed by the artist.",
      zh: "两朵淡紫牡丹，枝叶以浓墨数笔写出。画家题款、署名并钤印。",
    },
  },
  {
    id: "peony-full-bloom", ...img("peony-full-bloom"),
    category: "flowers",
    title: { en: "Peony in Full Bloom", zh: "国色天香" },
    date: null,
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "A crimson peony opens at the heart of the page, with buds and loose petals drifting above and a dark branch rising on the right.",
      zh: "一朵绯红牡丹盛开于画心，上方花蕾与花瓣轻盈飘散，右侧墨枝挺然而起。",
    },
  },
  {
    id: "spring-abundance", ...img("spring-abundance"),
    category: "flowers",
    title: { en: "Spring Abundance", zh: "春华" },
    date: null,
    medium: COLOR_ON_PAPER, size: null,
    note: {
      en: "Branches, leaves and blossoms fill the whole sheet in a loose, joyful rhythm, a study in color and movement.",
      zh: "枝叶与花朵铺满全幅，笔意松快，节奏欢欣，是一幅关于色彩与律动的习作。",
    },
  },
  {
    id: "trees-on-rock", ...img("trees-on-rock"),
    category: "landscape",
    title: { en: "Trees on a Rock", zh: "林石" },
    date: "2022-08-03",
    medium: { en: "Ink and light color on xuan paper", zh: "纸本水墨淡彩" },
    size: null,
    note: {
      en: "A small grove stands on a broad stone, the foliage built up from countless small touches of ink. Dated and marked with two seals.",
      zh: "一丛树木立于宽厚的石台之上，树叶由无数细小墨点层层积成。落款纪年，钤印两方。",
    },
  },
];
