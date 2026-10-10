# Translation style

Applies to `en.json`, `de.json` and the Markdown files in `src/content/<locale>/`.

## All languages

- Keep message IDs, `{placeholders}` and `<tags>` exactly as in `en.json`. The build checks this.
- Keep within `maxLength` (characters of text, placeholders not counted). The build checks this.
- Use the terms in `glossary.json`. The build checks them.
- Write short, plain sentences. No marketing words. No `·` separator.
- Write numbers, dates and lists through placeholders. Never type a date or a percent sign into a message.

## English (source)

- British spelling: modelled, licence.
- Sentence case for labels and titles.
- Typographic apostrophes and quotes: ’ “ ”.

## German

- Formal address: Sie, Ihr, Ihnen. Never du.
- People: paired forms (Entwicklerinnen und Entwickler, Anlegerinnen und Anleger) or neutral forms (Studierende). No gender star or colon.
- No Denglisch where an established German word exists: Beratung, not Consulting. The English terms in `glossary.json` stay English.
- KI, never AI.
- Quotes: „ “. Ellipsis after a space: Wird gesendet …
