# Wordly

Wordly is a responsive, single-page English dictionary. Search for a word to
see its definitions, examples, synonyms, pronunciation, and source link.

## Features

- Search using the [Free Dictionary API](https://dictionaryapi.dev/).
- View definitions, example sentences, and synonyms.
- Click a synonym to search for it.
- Play pronunciation audio when the API provides an audio file.
- Clear feedback for empty searches, words that are not found, and network or
  service errors.
- Responsive layout with keyboard-friendly focus states.

## Run locally

No build step or package installation is required. From the project directory,
start a local web server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser. Searching requires an
internet connection to reach the Dictionary API.
