// All site content lives here. To add a painting: put its images in /images
// (a large "name.jpg" and a small "name-sm.jpg"), then add an entry to WORKS.
// Leave a field as null if it's unknown — the page shows it as "to be added".

const SITE = {
  // Address that receives inquiries. Leave empty to hide the contact links.
  contactEmail: "",
};

const CATEGORIES = {
  flowers:   { en: "Flowers",   zh: "花卉" },
  landscape: { en: "Landscape", zh: "山水" },
};

const WORKS = [
  {
    id: "peony-2024",
    image: "images/peony-2024.jpg",
    thumb: "images/peony-2024-sm.jpg",
    framed: "images/peony-2024-framed.jpg",
    category: "flowers",
    title: { en: "Peony", zh: "牡丹" },
    date: "2024-09-22",
    medium: { en: "Ink and color on xuan paper", zh: "纸本设色" },
    size: null,
    note: {
      en: "Two peonies in soft violet, their leaves set down in a few bold strokes of ink. Titled, signed and sealed by the artist.",
      zh: "两朵淡紫牡丹，枝叶以浓墨数笔写出。画家题款、署名并钤印。",
    },
  },
  {
    id: "peony-full-bloom",
    image: "images/peony-full-bloom.jpg",
    thumb: "images/peony-full-bloom-sm.jpg",
    category: "flowers",
    featured: true,
    title: { en: "Peony in Full Bloom", zh: "国色天香" },
    date: null,
    medium: { en: "Ink and color on xuan paper", zh: "纸本设色" },
    size: null,
    note: {
      en: "A crimson peony opens at the heart of the page, with buds and loose petals drifting above and a dark branch rising on the right.",
      zh: "一朵绯红牡丹盛开于画心，上方花蕾与花瓣轻盈飘散，右侧墨枝挺然而起。",
    },
  },
  {
    id: "spring-abundance",
    image: "images/spring-abundance.jpg",
    thumb: "images/spring-abundance-sm.jpg",
    category: "flowers",
    title: { en: "Spring Abundance", zh: "春华" },
    date: null,
    medium: { en: "Ink and color on xuan paper", zh: "纸本设色" },
    size: null,
    note: {
      en: "Branches, leaves and blossoms fill the whole sheet in a loose, joyful rhythm, a study in color and movement.",
      zh: "枝叶与花朵铺满全幅，笔意松快，节奏欢欣，是一幅关于色彩与律动的习作。",
    },
  },
  {
    id: "trees-on-rock",
    image: "images/trees-on-rock.jpg",
    thumb: "images/trees-on-rock-sm.jpg",
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
