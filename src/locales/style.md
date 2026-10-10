# Translation style

Applies to `en.json`, `de.json` and the Markdown files in `src/content/<locale>/`.

## All languages

- Keep message IDs, `{placeholders}` and `<tags>` exactly as in `en.json`. The build checks this.
- Keep within `maxLength` (characters of text, placeholders not counted). The build checks this.
- Use the terms in `glossary.json`. The build checks them.
- Write short, plain sentences. No marketing words. No `·` separator.
- Write numbers, dates and lists through placeholders. Never type a date or a percent sign into a message.

## When the English changes

The build stops until every translation is up to date. CI runs the build on every push.

- New message: add it to `en.json` with a `description`, and a `maxLength` where space is tight. Add it to `de.json` with the English as `source` and the German as `message`.
- Changed message: the build names each German message whose `source` is not the English in `en.json`. Update `message`, then copy the new English into `source`.
- Changed page or post: the build names each German file made from an older English file and prints the new fingerprint. Read the change with `git log -p` on the English file, update the German, then set `source:` in its front matter to the printed fingerprint.
- New post: write it in every language, with the same file name, date and author. A translation adds `source:`.

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
