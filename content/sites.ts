/**
 * THE CONCEPT WEBSITES: three complete websites the studio designed and built
 * for fictional businesses (a bakery, an architecture studio, an adventure
 * company). Each one is served as it is from public/sites/<slug>/ (imported by
 * tools/showcase/import.py) and pictured by tools/showcase/shots.mjs and
 * webp.py into public/work/<slug>/. Rendered by /work/[slug] (SiteStudy).
 *
 * Every figure in `facts` was measured on the hosted copy (2026-10-06, a
 * desktop first visit, sizes compressed as served) and every line in `craft`
 * was checked in the site's own code. Plain New Zealand English, no em dashes
 * (docs/BLOG-GUIDE.md); the businesses, people and prices are fictional and
 * say so. For the client's sign-off with the rest of the copy.
 */
import type { Project, Shot } from "./work";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const W = `${BASE}/work`;

/** A picture in public/work/<slug>/ (with its half-size copy where there is one). */
const shot = (slug: string, name: string, w: number, h: number, alt: string, label?: string): Shot => ({
  src: `${W}/${slug}/${name}.webp`,
  half: name.startsWith("f-") ? `${W}/${slug}/${name}-1000.webp` : name === "home" ? `${W}/${slug}/home-1200.webp` : undefined,
  w,
  h,
  alt,
  label,
});
const phone = (slug: string, name: string, alt: string, caption: string) => ({ ...shot(slug, name, 780, 1688, alt), caption });
const page = (slug: string, name: string) => `${W}/${slug}/${name}.webp`;

export const SITE_PROJECTS: Project[] = [
  /* ---------------------------------------------------------------- */
  {
    slug: "butter-days",
    kind: "site",
    client: "Butter Days",
    title: "A website for a neighbourhood bakery, from the morning menu to the wedding cake",
    summary:
      "A fictional bakery in Kelburn, Wellington, and its eight-page website: the menu, a pastry box you can build, a cake planner and opening hours that know the time.",
    services: ["websites"],
    url: "butterdays.example",
    year: "2026",
    cover: `${W}/butter-days.webp`,
    coverTall: `${W}/butter-days-tall.webp`,
    coverAlt: "The Butter Days home page: the name set large in a warm serif, a photograph of croissants in an arch, and the opening facts.",
    context: {
      lede: "A good bakery sells out by eleven and lives on word of mouth. Its website has three jobs: show what’s in the cabinet, make the big orders (a birthday cake, a dessert table, a box for the office) easy to ask for, and get people through the door while it’s open. A PDF menu and a phone number do none of them well.",
      audience:
        "Neighbours deciding where to get coffee, people planning a birthday or a wedding, and visitors looking for somewhere good near the cable car. Most of them on a phone.",
    },
    scope: [
      "Eight pages, written and designed from a blank page",
      "A visual identity for the site: type, colour and drawings",
      "A pastry box, a cake planner and live opening hours",
      "Enquiry and contact forms with clear, specific errors",
      "Search foundations: titles, descriptions, bakery data, a sitemap",
      "Accessibility, print and reduced-motion styles",
    ],
    approach: [
      {
        title: "Warm, and specific to the shop",
        body: "Butter yellow, cherry red and cream, with a soft serif for the name and the prices. Drawings made for the site carry the personality; photographs show the baking.",
      },
      {
        title: "The menu is a page, not a PDF",
        body: "Pastries, bread, cakes and drinks in four tabs, with prices, baking times and notes such as ‘Saturdays only’, all in text that phones, search engines and screen readers can read.",
      },
      {
        title: "Big orders start with the right questions",
        body: "The cake planner turns a guest count into a suggested cake and carries it into the enquiry, so the bakery’s first reply can be a quote rather than more questions.",
      },
      {
        title: "Opening hours that know what time it is",
        body: "Every page works out the time in Wellington and says whether the bakery is open now, or when it next opens. Today’s hours are highlighted wherever they’re listed.",
      },
    ],
    demonstrates: [
      "A menu people can read on a phone, link to and find in search",
      "Enquiry tools that gather what a business needs to reply with a quote",
      "Opening hours that are right whenever someone looks",
      "An identity that belongs to one shop, not a theme",
    ],
    limits: [
      "Butter Days is fictional: the people, prices, address and phone number are samples.",
      "The forms and the pastry box run in your browser and send nothing. A live site would send enquiries to the bakery’s inbox or ordering system.",
      "There is no online ordering or payment. That would be its own scope (see Platforms).",
      "The photographs are stock, used under the Unsplash Licence. A live site would use the bakery’s own.",
    ],
    site: {
      live: `${BASE}/sites/butter-days/`,
      sector: "Independent bakery and café",
      place: "Kelburn, Wellington",
      home: shot("butter-days", "home", 2400, 1500, "The Butter Days home page on a desktop."),
      jobs: [
        "Show what’s baked today, with prices, in a menu that works on a phone",
        "Turn cake and catering questions into complete enquiries",
        "Say when it’s open, and how to get there",
      ],
      pageCount: 8,
      pages: [
        { name: "Home", path: "index.html", what: "The morning’s bakes, the season’s special, the pastry box and the way to the shop.", shot: `${W}/butter-days/home-1200.webp` },
        { name: "Menu", path: "menu.html", what: "Four tabs: pastries, bread, cakes and drinks, with prices and baking times.", shot: page("butter-days", "page-menu") },
        { name: "Cakes and catering", path: "cakes-and-catering.html", what: "Cake styles, the planner, a serving-size table and the enquiry form.", shot: page("butter-days", "page-cakes") },
        { name: "Our bakery", path: "our-bakery.html", what: "The story, a morning in the bakery, four house rules and the people at the counter.", shot: page("butter-days", "page-bakery") },
        { name: "Visit", path: "visit.html", what: "Hours that know if it’s open, a drawn map, how to get there, and a contact form.", shot: page("butter-days", "page-visit") },
        { name: "Almond croissant", path: "product-almond-croissant.html", what: "One bake told in full: why it exists, ingredients, allergens, how to eat it.", shot: page("butter-days", "page-croissant") },
        { name: "Country sourdough", path: "product-country-sourdough.html", what: "The loaf and its starter, in the same layout, mirrored.", shot: page("butter-days", "page-sourdough") },
        { name: "Celebration cake", path: "product-seasonal-celebration-cake.html", what: "How the cake is built, and the way into an enquiry.", shot: page("butter-days", "page-cake") },
      ],
      features: [
        {
          title: "Build a box of six",
          body: "Pick up to six pastries and the box fills as you go, with a running total. Any choice can be taken out again. ‘Enquire about this box’ writes the selection into the enquiry form, so the bakery receives an order it can read rather than a vague request.",
          shots: [shot("butter-days", "f-box", 2000, 1828, "The pastry box: five pastries chosen, the drawn box filling up, a running total of $34.00 and a chip for each choice.")],
          notes: [
            "Works with a keyboard as well as a finger or a mouse",
            "The count and the total are read out to screen readers as they change",
            "At six it says the box is full, rather than quietly ignoring the seventh",
          ],
          path: "index.html#saturday-box",
        },
        {
          title: "How much cake?",
          body: "Slide to the number of guests and say how the cake will be eaten. The planner suggests a style and a size, and ‘Use this in my enquiry’ carries the suggestion into the form.",
          shots: [shot("butter-days", "f-planner", 2000, 1364, "The cake planner set to 45 guests, suggesting a two-tier cake of 20 cm and 15 cm tiers, cut into finger portions.")],
          notes: [
            "Ten to 120 guests, fine-tuned with the arrow keys",
            "Its suggestions follow the serving-size table further down the page",
          ],
          path: "cakes-and-catering.html",
        },
        {
          title: "A menu that is a real page",
          body: "Each tab has its own address, so a link to the cakes opens on the cakes. Prices, baking times and notes are text, not a picture of a menu, so they can be read aloud, translated and found in search.",
          shots: [shot("butter-days", "f-menu", 2000, 1301, "The menu’s cakes tab: cakes by the slice with prices, and cakes made to order with a note to allow two days.")],
          notes: ["The arrow keys move between tabs, as keyboard users expect", "Allergen guidance at the foot of every tab"],
          path: "menu.html#tab-cakes",
        },
        {
          title: "Open now?",
          body: "The site works out the time in Wellington and says whether the bakery is open and when it next opens. Beside it, a drawn map of the neighbourhood and the ways there: the bus, the cable car, parking, or a walk up from the waterfront.",
          shots: [shot("butter-days", "f-visit", 2000, 1182, "The visit page: a drawn neighbourhood map beside the opening hours and the ways to get there.")],
          notes: ["Today’s hours are highlighted in every list of hours", "The same hours are in the page’s data for search engines"],
          path: "visit.html",
        },
      ],
      phones: [
        phone("butter-days", "phone-home", "The Butter Days home page on a phone.", "The first screen: the name, one line, two ways in and three facts."),
        phone("butter-days", "phone-menu", "The menu on a phone.", "The menu tabs wrap to two rows; every price stays beside its item."),
        phone("butter-days", "phone-cakes", "The cake planner on a phone.", "The planner fits one screen: the count, the slider and the choice."),
      ],
      palette: [
        { name: "Butter", hex: "#F5C043", role: "The awning, buttons, highlights" },
        { name: "Cherry", hex: "#A63F35", role: "Headings and calls to action" },
        { name: "Blush", hex: "#F6DFDA", role: "Quiet sections" },
        { name: "Cream", hex: "#FBF3E7", role: "The page" },
        { name: "Chocolate", hex: "#46281A", role: "Text" },
        { name: "Teal", hex: "#3F6B79", role: "Drawings" },
      ],
      type: [
        { name: "Fraunces", role: "The name, headings and prices: a soft serif with an italic for emphasis" },
        { name: "DM Sans", role: "Reading text, labels and buttons" },
      ],
      facts: [
        { value: "8", label: "pages, each checked at phone and desktop sizes" },
        { value: "10 KB", label: "of JavaScript on a page, compressed. No framework" },
        { value: "0.4 MB", label: "for the home page on a first visit, photographs and fonts included" },
        { value: "3", label: "tools that do a job: the pastry box, the cake planner and the opening hours" },
      ],
      craft: [
        "Respects reduced motion, higher contrast and forced colours settings, and has its own animations switch in the footer",
        "Without JavaScript every page still reads in full; the tools are added on top",
        "Bakery data on every page (address, hours, contact) for search engines",
        "A print stylesheet, a skip link and visible focus on every control",
        "Forms point to the field that needs fixing and say why",
      ],
      photos: "Stock photographs used under the Unsplash Licence, and drawings made for the site.",
    },
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "blackridge",
    kind: "site",
    client: "Blackridge",
    title: "A portfolio website for an architecture studio, quiet enough to let the buildings talk",
    summary:
      "A fictional architecture studio and its thirteen-page portfolio: three projects in full, a pavilion study you can take apart, and printable project sheets.",
    services: ["websites"],
    url: "blackridge.example",
    year: "2026",
    cover: `${W}/blackridge.webp`,
    coverTall: `${W}/blackridge-tall.webp`,
    coverAlt: "The Blackridge home page: the studio’s name in large pale capitals over a modern house lit at dusk.",
    context: {
      lede: "An architecture practice is judged on its buildings, and most future clients meet those buildings on a screen first. The site has to show each project the way the studio would walk you round it (the site, the idea, the materials, the rooms), explain how the studio works, and start a conversation with the few clients a small practice can take each year.",
      audience:
        "People planning a house, a guesthouse or a small commercial building, and the people advising them. They read slowly, often on a large screen, and they notice details.",
    },
    scope: [
      "Thirteen pages: projects, studio, approach, journal, contact and credits",
      "One shape for every project, so new ones drop in",
      "The pavilion study: an interactive model in three states",
      "A lightbox for every gallery, with credits",
      "A print stylesheet that turns a project into an A4 sheet",
      "Self-hosted fonts and photographs: nothing loaded from elsewhere",
    ],
    approach: [
      {
        title: "Every project told the same way",
        body: "An opening photograph, a strip of facts (where, what, when, who), a three-paragraph narrative, the material palette and eight views. Projects can be compared, and a new one takes the same shape.",
      },
      {
        title: "Dark, quiet and slow",
        body: "A charcoal page, pale type and one copper accent. Archivo for names, Fraunces for the writing, and IBM Plex Mono for coordinates and figure numbers, the way drawings are annotated.",
      },
      {
        title: "A study you can take apart",
        body: "The home page’s pavilion study shows a building the way architects present a scheme: the site, the structure lifted apart, and the building in low sun. It explains how the studio thinks, rather than decorating the page.",
      },
      {
        title: "Nothing from anywhere else",
        body: "Fonts and photographs are served by the site itself. It makes no requests to other servers, sets no cookies and does no tracking, which keeps it fast and keeps visitors’ browsing their own.",
      },
    ],
    demonstrates: [
      "A way to present projects that grows with the practice",
      "An interactive study that explains an idea, not decoration",
      "Project sheets that print properly from the same pages",
      "A fast, private site: no third-party requests and no cookies",
    ],
    limits: [
      "Blackridge, its people, projects and history are fictional. The buildings in the photographs are real but are not its work, and every photograph is credited on the site.",
      "The enquiry form checks what you type and sends nothing.",
      "This version has no editor. A live site would come with one, so the studio adds projects and journal entries itself.",
      "The photographs are used under the Unsplash Licence. A live site would use the studio’s own photography.",
    ],
    site: {
      live: `${BASE}/sites/blackridge/`,
      sector: "Architecture and interiors studio",
      place: "Eden Terrace, Auckland",
      home: shot("blackridge", "home", 2400, 1500, "The Blackridge home page on a desktop."),
      jobs: [
        "Tell each project as a walk round the building, not a slideshow",
        "Show how the studio thinks before anyone calls",
        "Invite an enquiry that starts with the site",
      ],
      pageCount: 13,
      pages: [
        { name: "Home", path: "index.html", what: "The studio in one scroll: the idea, three projects, the pavilion study, the journal.", shot: `${W}/blackridge/home-1200.webp` },
        { name: "Projects", path: "projects/", what: "Three buildings, each with where, when and how big.", shot: page("blackridge", "page-projects") },
        { name: "Cliff House", path: "projects/cliff-house/", what: "A coastal house in full: the narrative, the materials and eight views.", shot: page("blackridge", "page-cliff") },
        { name: "Folded Earth", path: "projects/folded-earth/", what: "A vineyard guesthouse in rammed earth, in the same shape.", shot: page("blackridge", "page-folded") },
        { name: "Courtyard Office", path: "projects/courtyard-office/", what: "A brick warehouse turned workplace, in the same shape again.", shot: page("blackridge", "page-courtyard") },
        { name: "Studio", path: "studio/", what: "Who they are, how they work, and ten years on a timeline.", shot: page("blackridge", "page-studio") },
        { name: "Approach", path: "approach/", what: "Four principles, applied slowly.", shot: page("blackridge", "page-approach") },
        { name: "Journal", path: "journal/", what: "Occasional writing on site, weather and materials.", shot: page("blackridge", "page-journal") },
        { name: "An essay", path: "journal/the-second-decade/", what: "A long read, set for reading.", shot: page("blackridge", "page-essay") },
        { name: "Contact", path: "contact/", what: "An enquiry that starts with the ground, the brief and the light.", shot: page("blackridge", "page-contact") },
      ],
      features: [
        {
          title: "The pavilion study",
          body: "A small hill pavilion in three states: the site, the structure lifted apart, and the building in low sun. Buttons, the arrow keys or 1, 2 and 3 move between them, a caption says what each state shows (read out to screen readers too), and Cycle plays them in turn, pausing while the study is off screen.",
          shots: [
            shot("blackridge", "f-study-site", 2000, 1251, "The pavilion study, state one: the timber pavilion on its site in long grass.", "01 Site"),
            shot("blackridge", "f-study-structure", 2000, 1251, "The pavilion study, state two: a glass study model of the structure.", "02 Structure"),
            shot("blackridge", "f-study-light", 2000, 1251, "The pavilion study, state three: the glazed room lit against a dusk sky.", "03 Light"),
          ],
          notes: ["Three states, three ways to move between them, one caption", "With reduced motion on, it waits for you: no cycling, no light sweep"],
          path: "index.html#study",
        },
        {
          title: "Eight views, enlarged",
          body: "Every project’s gallery opens in a lightbox with the view’s name and its photographer’s credit. The arrow keys move between views, Escape closes it, and focus goes back to where you were.",
          shots: [shot("blackridge", "f-lightbox", 2000, 1250, "The lightbox open on Cliff House’s living floor at dusk, with its caption, its credit and the arrows.")],
          notes: ["A counter (1 of 8) and the credit with every view", "Keyboard first: no view is only reachable by mouse"],
          path: "projects/cliff-house/",
        },
        {
          title: "A project sheet, printed",
          body: "Print a project page and it comes out as an A4 project sheet, the way studios hand them over: the title, the facts as a table, the narrative, the material palette in exact colours and the lead photographs.",
          shots: [shot("blackridge", "f-print", 2000, 2714, "Cliff House printed as an A4 project sheet: the title, a table of facts, the design narrative and the material palette.")],
          notes: ["The same page, a print stylesheet: nothing to keep in step", "A ‘Print project sheet’ button on every project"],
          path: "projects/cliff-house/",
          tall: true,
        },
        {
          title: "Materials, not mood boards",
          body: "Each project closes with its material palette: five materials, each with where it is used and where it came from. Solid colours with a fine grain, never a photograph pretending to be a texture.",
          shots: [shot("blackridge", "f-palette", 2000, 420, "Cliff House’s material palette: split basalt, blackened cedar, copper, limestone render and oiled oak.")],
          notes: ["Prints in exact colours on the project sheet"],
          path: "projects/cliff-house/",
        },
      ],
      phones: [
        phone("blackridge", "phone-home", "The Blackridge home page on a phone.", "The name set large over the house, with the two ways in."),
        phone("blackridge", "phone-cliff", "Cliff House on a phone.", "A project opens on its photograph and one line."),
        phone("blackridge", "phone-study", "The pavilion study on a phone.", "The study at phone size: the three states under the picture."),
      ],
      palette: [
        { name: "Charcoal", hex: "#171513", role: "The page" },
        { name: "Shell", hex: "#EFE9DD", role: "Text" },
        { name: "Limestone", hex: "#D9CDB6", role: "Quieter text and rules" },
        { name: "Olive", hex: "#575D3F", role: "Supporting tone" },
        { name: "Copper", hex: "#A5602E", role: "The one accent: marks, rules, buttons" },
      ],
      type: [
        { name: "Archivo", role: "Names and labels, in capitals" },
        { name: "Fraunces", role: "The narrative and the essays" },
        { name: "IBM Plex Mono", role: "Coordinates, figure numbers and captions" },
      ],
      facts: [
        { value: "13", label: "pages: three projects, three essays, studio, approach, contact and credits" },
        { value: "0", label: "requests to other servers. No cookies, no tracking" },
        { value: "0", label: "automated accessibility failures on any page (axe, WCAG 2.1 AA)" },
        { value: "6 KB", label: "of JavaScript at most on a page, compressed" },
      ],
      craft: [
        "Fonts are self-hosted and preloaded in every page’s head",
        "Reduced motion (or the animations switch in the footer) turns off the page curtain, the reveals and the parallax",
        "Every photograph credited to its photographer, in the lightbox and on a credits page",
        "Article data for the essays and organisation data on the home page, for search",
        "Checked at phone width: nothing scrolls sideways, galleries restack",
      ],
      photos: "Photographs used under the Unsplash Licence, each credited on the site’s credits page.",
    },
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "outbound",
    kind: "site",
    client: "Outbound",
    title: "A website for a small-group adventure company that helps people pick the right trip",
    summary: "A fictional adventure company and its website: three trips told in full, a route map, and three questions that point you to the right one.",
    services: ["websites"],
    url: "outbound.example",
    year: "2026",
    cover: `${W}/outbound.webp`,
    coverTall: `${W}/outbound-tall.webp`,
    coverAlt: "The Outbound home page: bold condensed capitals over a mountain sea of cloud at dawn, with an acid-yellow button.",
    context: {
      lede: "Adventure trips sell on feeling and are booked on facts. People want to picture themselves on the ridge, then they want to know how hard it is, what to bring, what happens if the weather turns, and what it costs. If the facts are buried in a PDF, the feeling leaves with them.",
      audience: "Friends and couples planning a weekend away, some new to the outdoors, usually comparing trips on a phone.",
    },
    scope: [
      "Eleven pages: home, trips, approach, field notes, contact",
      "Three trip pages in one order: the day, the kit, the meeting point, the questions",
      "A trip matcher, a route map and filters",
      "An enquiry form for dates and group size",
      "A bold identity: type, colour and texture",
      "Search foundations and reduced-motion styles",
    ],
    approach: [
      {
        title: "Feeling first, facts straight after",
        body: "Bold type over the landscape, then the details on every trip page in the same order: the day hour by hour, what’s included, what to bring, where to meet, and the questions people ask.",
      },
      {
        title: "Three questions instead of a wall of filters",
        body: "The matcher asks how hard, what ground and how long, then names one trip and says why. With three trips that is quicker than any filter, and it feels like asking a guide.",
      },
      {
        title: "A map that is also a list",
        body: "The route map traces where each trip runs, and every destination on it is an ordinary link as well, so it works without JavaScript and with a screen reader.",
      },
      {
        title: "Straight about the weather",
        body: "Every trip says when it runs, how and when the go or no-go call is made, and what happens if it is called off. That is the question that decides most bookings.",
      },
    ],
    demonstrates: [
      "A bold identity that still puts the practical facts first",
      "Tools that help people choose, without a form",
      "Trip pages in one consistent order that answer questions before they’re asked",
      "Clear labels wherever details are illustrative",
    ],
    limits: [
      "Outbound is fictional. Its trips, prices, seasons and the guests quoted on it are samples, and the site says so where they appear.",
      "The enquiry form and the matcher run in your browser and send nothing. There is no booking or payment.",
      "The photographs are stock, used under the Unsplash Licence. A live site would use the company’s own.",
      "An automated check flags a few small labels whose colours are too close to their background. A live version would fix those before launch.",
    ],
    site: {
      live: `${BASE}/sites/outbound/`,
      sector: "Small-group guided adventures",
      place: "Aotearoa New Zealand",
      home: shot("outbound", "home", 2400, 1500, "The Outbound home page on a desktop."),
      jobs: [
        "Help people find the right trip quickly",
        "Answer the practical questions before they’re asked",
        "Turn a weekend in mind into an enquiry with dates",
      ],
      pageCount: 11,
      pages: [
        { name: "Home", path: "index.html", what: "The feeling, the numbers, three trips, the matcher, the map and the stories.", shot: `${W}/outbound/home-1200.webp` },
        { name: "Adventures", path: "adventures.html", what: "The three trips, filtered by region and difficulty.", shot: page("outbound", "page-adventures") },
        { name: "Ridge to River", path: "adventures/ridge-to-river.html", what: "A day on a ridge, then a packraft home: the day hour by hour.", shot: page("outbound", "page-ridge") },
        { name: "After the Tide", path: "adventures/after-the-tide.html", what: "Two days on the coast, timed to the tide.", shot: page("outbound", "page-tide") },
        { name: "Above the Clouds", path: "adventures/above-the-clouds.html", what: "A high-country walk timed for the morning inversion.", shot: page("outbound", "page-clouds") },
        { name: "Our approach", path: "approach.html", what: "How a trip is run, on one page.", shot: page("outbound", "page-approach") },
        { name: "Field notes", path: "field-notes/index.html", what: "Dispatches from the season.", shot: page("outbound", "page-notes") },
        { name: "A field note", path: "field-notes/reading-the-inversion.html", what: "Reading the inversion: a short lesson in mountain weather.", shot: page("outbound", "page-note") },
        { name: "Contact", path: "contact.html", what: "One form: the trip, the group, the date.", shot: page("outbound", "page-contact") },
      ],
      features: [
        {
          title: "Three questions, one trip",
          body: "How hard do you want to push, what ground calls you, how much time can you give it. The answer names one trip and gives the reason in your own words (‘you want high ground at a full-send pace with one good day to spend’), with its price, length and grade.",
          shots: [shot("outbound", "f-matcher", 2000, 698, "The trip matcher: full send, high ground and one good day chosen, and the answer, Above the Clouds, with the reason and the price.")],
          notes: ["Changes as you change your mind, with no submit button", "Answers stay in the browser; nothing is sent anywhere"],
          path: "index.html",
        },
        {
          title: "The map, and the links under it",
          body: "Choose a route and its line draws itself across the island, with the trip’s card beside it: where, how long, how hard, when it runs. Every destination is also an ordinary link, so the map is a shortcut rather than the only way in.",
          shots: [shot("outbound", "f-map", 2000, 2007, "The route map with Above the Clouds selected: the South Island outlined, the route marked, and the trip’s card beside it.")],
          notes: ["Markers and buttons both work, by mouse, touch or keyboard", "Works as a plain list of links without JavaScript"],
          path: "index.html#route-map",
          tall: true,
        },
        {
          title: "What to bring, ticked off",
          body: "Each trip page lists what’s included and what to bring, side by side. Tick things off as you pack and the count keeps up, so the page doubles as the night-before checklist.",
          shots: [shot("outbound", "f-pack", 2000, 1528, "Ridge to River’s practical section: what is included on one side, and a packing list with four items ticked off on the other.")],
          notes: ["Real checkboxes with labels, so they work for everyone", "The season and weather notes sit right under it"],
          path: "adventures/ridge-to-river.html#included",
        },
        {
          title: "Filter by what matters",
          body: "Region and difficulty, with a live count of the trips shown and a reset. With three trips it is quick; the same pattern holds thirty without changing the page.",
          shots: [shot("outbound", "f-filter", 2000, 1067, "The adventures list filtered to moderate trips: one card, Ridge to River, with its grade, length and season.")],
          notes: ["The number of trips shown updates as you filter"],
          path: "adventures.html",
        },
      ],
      phones: [
        phone("outbound", "phone-home", "The Outbound home page on a phone.", "The first screen keeps its weight on a phone: the line, the action, the map."),
        phone("outbound", "phone-trip", "The Above the Clouds trip page on a phone.", "A trip opens on what it is, then how long, where, how hard and how much."),
        phone("outbound", "phone-map", "The route map on a phone.", "The route map at phone size, every destination still a link."),
      ],
      palette: [
        { name: "Acid", hex: "#CCFF00", role: "Calls to action and highlights" },
        { name: "Cobalt", hex: "#0328EE", role: "Choices and routes" },
        { name: "Signal orange", hex: "#FF5A1F", role: "Tags and warnings" },
        { name: "Ink", hex: "#111311", role: "Dark sections and text" },
        { name: "Paper", hex: "#F6F1E7", role: "Light sections" },
      ],
      type: [
        { name: "Oswald", role: "Headlines and labels, condensed capitals" },
        { name: "Source Sans 3", role: "Reading text" },
      ],
      facts: [
        { value: "11", label: "pages, three of them trips told in the same order" },
        { value: "0.4 MB", label: "for the home page on a first visit, photographs and fonts included" },
        { value: "17 KB", label: "of JavaScript at most on a page, compressed. No framework" },
        { value: "0", label: "forms to fill in before the matcher answers" },
      ],
      craft: [
        "Reduced motion honoured throughout, with an animations switch in the footer as well",
        "Every route on the map is also an ordinary link",
        "Labels and checkboxes everywhere a choice is made, for keyboards and screen readers",
        "‘Illustrative’ printed beside every sample price and figure",
        "A designed 404 page, in the same voice",
      ],
      photos: "Stock photographs used under the Unsplash Licence.",
    },
  },
];
