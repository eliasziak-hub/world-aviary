# World-Aviary Explorer · v1.0

Διαδραστική υδρόγειος («Google Earth για τα πουλιά») για το **poulia4.blogspot.com**:
Ήπειρος → Οικογένεια → Γένος → Άρθρα, με φίλτρα βιοτόπου, «Ραντάρ γενών», συρτάρι καρτών άρθρων (φωτογραφία, ♫ Xeno-canto, «Διάβασε στο Blog») και πάνελ **Έλεγχος νέων άρθρων**.

## Τι περιέχεται
| Αρχείο | Σκοπός |
|---|---|
| `dist/poulia4-world-aviary-v1.js` | Το widget (ένα αρχείο, IIFE, ~236 KB, μόνο ASCII – ασφαλές για το Blogger) |
| `dist/poulia4-world-aviary-v1.html` | Αυτόνομη σελίδα για δοκιμή/ενσωμάτωση (το script είναι μέσα) |
| `src/` | Πηγαίος κώδικας: `engine.js` (ταξινομικός κινητήρας), `globe.js`, `ui.js`, `loader.js`, `data/` |
| `tools/check-new-posts.mjs` | Έλεγχος νέων άρθρων από γραμμή εντολών (Node ≥ 18) |
| `.github/workflows/weekly-check.yml` | Προαιρετικός εβδομαδιαίος αυτόματος έλεγχος (GitHub Actions) |
| `extra-genera.txt` | Δικά σας επιβεβαιωμένα γένη (`Γένος\|Οικογένεια\|SA,NA`) |
| `tests/` | 30 unit tests + fixture feed + Playwright QA |

## Ενσωμάτωση στο Blogger
1. Ανεβάστε το `poulia4-world-aviary-v1.js` όπου φιλοξενείτε τα υπόλοιπα scripts σας (GitHub Pages, jsDelivr, Cloudflare κ.λπ.).
2. Στην ανάρτηση/σελίδα (προβολή HTML) ή σε gadget «HTML/JavaScript»:
```html
<div id="poulia4-world-aviary"></div>
<script>
  window.P4_WORLD_AVIARY = {
    blogUrl: 'https://poulia4.blogspot.com',
    apiBase: 'https://poulia4-bird-identifier-wizard.eliasziak.workers.dev', // φωτογραφίες GBIF + ήχοι Xeno-canto
    autoRotate: false,
    extraGenera: ['Zorbus|Psittacidae|SA']   // προαιρετικά
  };
</script>
<script src="https://ΔΙΚΟ-ΣΑΣ-HOST/poulia4-world-aviary-v1.js"></script>
```
Το widget φορτώνει τα άρθρα με τη σειρά: `getAllPosts()` / `POULIA4_POSTS` / `blogCache` / `Poulia4SemanticEngine` της σελίδας → δημόσιο feed του Blogger (σελιδοποιημένο) → τοπική cache (30′, stale-while-revalidate). Ξεκινά μόνο όταν πλησιάσει στην οθόνη (IntersectionObserver).
JS API: `window.Poulia4WorldAviary.{refresh, getStatus, getIndex, getReport, select, setHabitat}` · συμβάν `p4:world-aviary:ready`.

## Πώς ταξινομούνται τα άρθρα
1. **URL καταλόγου** – αντιστοίχιση με τα 462 είδη του Bird Wizard (ανεξάρτητα από domain). Αν ένα άρθρο καλύπτει *πολλά* είδη (31 τέτοιες περιπτώσεις), το είδος επιλέγεται μόνο αν το προσδιορίζει ο τίτλος· αλλιώς δεν βάζεται αυθαίρετο επιστημονικό όνομα.
2. **Ετικέτα = γένος** ή ετικέτα = οικογένεια (ελληνικά ονόματα οικογενειών από το Wizard).
3. **Ελληνικός τίτλος = όνομα είδους** του καταλόγου.
4. **Διωνυμικό** (π.χ. *Ara macao*) με γένος γνωστό από τον κατάλογο ή τον παγκόσμιο πίνακα `GLOBAL_GENERA` (~190 γένη).
5. **Άγνωστο γένος** → καταγράφεται ως *υποψήφιο* (⚠ «προς επιβεβαίωση») από την αρχή του τίτλου ή από `scientificName`· **δεν του αποδίδεται οικογένεια αυθαίρετα**. Κοινές αγγλικές λέξεις αποκλείονται.
Ήπειρος: ετικέτα → κείμενο → γένος/οικογένεια → κατάλογος (Ευρώπη) → «Γενικά».

## Έλεγχος νέων άρθρων
* **Μέσα στο widget** (καρτέλα «Έλεγχος νέων άρθρων»): νέα άρθρα από τον τελευταίο έλεγχο *σε αυτόν τον browser*, γένη προς επιβεβαίωση, αταξινόμητα, αντιγραφή/λήψη JSON.
* **Γραμμή εντολών / αυτόματα:**
```bash
node tools/check-new-posts.mjs --seen seen.json --out reports --extra-genera extra-genera.txt --update-seen
```
  Γράφει `reports/world-aviary-report.{json,md}`. Το workflow GitHub Actions το τρέχει κάθε Δευτέρα.
* Όταν επιβεβαιώσετε ένα γένος, προσθέστε το στο `extra-genera.txt` (ή στο `extraGenera`).
> Οι προγραμματισμένες εργασίες του Claude δεν περιλαμβάνονται στο τρέχον πλάνο, γι' αυτό ο εβδομαδιαίος έλεγχος παρέχεται ως script + GitHub Action.

## Ανάπτυξη
```bash
npm install
npm test            # vitest
npm run build       # esbuild → dist/
node tools/build-data.mjs <φάκελος Wizard>   # ξαναδημιουργεί ηπείρους + κατάλογο (μόνο ανάγνωση από το Wizard)
```

## Περιορισμοί (ειλικρινά)
* **Δεν δοκιμάστηκε με το ζωντανό feed**: από το περιβάλλον ανάπτυξης δεν ήταν προσβάσιμο το `/feeds/`. Όλες οι δοκιμές έγιναν με fixture στο σχήμα του Blogger. Ελέγξτε την πρώτη φορά στο blog (F12 → Console: μηνύματα `[world-aviary]`).
* Οι **ήχοι** απαιτούν το Wizard worker με έγκυρο `XENO_CANTO_API_KEY`· χωρίς αυτό εμφανίζεται σχετικό μήνυμα. Οι φωτογραφίες GBIF περνούν από το ίδιο worker.
* Ο πίνακας `GLOBAL_GENERA` είναι ενδεικτικός, όχι πλήρης παγκόσμια ταξινομική βάση.
* Ηπείρους: Ρωσία χωρίζεται στον 60°Α· Τουρκία/Ινδονησία απλοποιημένες. Άρθρο με πολλές ηπείρους μετρά σε καθεμία.
* Το Bird Identifier Wizard και η Greek Flora PWA **δεν τροποποιήθηκαν** (το Wizard διαβάστηκε μόνο για δεδομένα).
