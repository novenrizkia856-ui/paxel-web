# Fonts

The site loads its typefaces from Google Fonts in `index.html`:

| Role | Family |
| --- | --- |
| Display | Instrument Serif, regular and italic |
| Body | Geist, variable 300 to 700 |
| Record data | Geist Mono, 400 and 500 |

To self host, put the `.woff2` files here, add `@font-face` rules at the top of
`assets/css/main.css`, and remove the Google Fonts `<link>` tags.
