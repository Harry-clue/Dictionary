const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const searchButton = form.querySelector('button[type="submit"]');
const clearButton = document.querySelector("#clear-search");
const errorMessage = document.querySelector("#search-error");
const emptyState = document.querySelector("#empty-state");
const results = document.querySelector("#results-content");

let currentRequest;

form.addEventListener("submit", searchForWord);
input.addEventListener("input", () => {
  errorMessage.textContent = "";
  clearButton.hidden = !input.value;
});
clearButton.addEventListener("click", clearSearch);

async function searchForWord(event) {
  event.preventDefault();

  const word = input.value.trim().replace(/\s+/g, " ");
  errorMessage.textContent = "";

  if (!word) {
    errorMessage.textContent = "Enter a word to search.";
    input.focus();
    return;
  }

  currentRequest?.abort();
  const request = new AbortController();
  currentRequest = request;

  searchButton.disabled = true;
  searchButton.textContent = "Searching…";
  clearButton.hidden = false;
  emptyState.hidden = true;
  results.hidden = false;
  showMessage("Searching the dictionary…", "loading-message");

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: request.signal },
    );

    if (response.status === 404) {
      throw new Error(`No definition found for “${word}”. Check the spelling and try again.`);
    }

    if (!response.ok) {
      throw new Error(
        `The dictionary service is unavailable right now (HTTP ${response.status}). Please try again.`,
      );
    }

    const entries = await response.json();
    if (!Array.isArray(entries) || !entries.some((entry) => Array.isArray(entry.meanings))) {
      throw new Error("The dictionary returned an unexpected response. Please try another word.");
    }

    showEntries(entries);
  } catch (error) {
    if (error.name === "AbortError") return;

    const message = error instanceof TypeError
      ? "Unable to reach the dictionary service. Check your internet connection and try again."
      : error.message || "Something went wrong while searching. Please try again.";
    showMessage(message, "result-error");
  } finally {
    if (currentRequest === request) {
      currentRequest = undefined;
      searchButton.disabled = false;
      searchButton.textContent = "Search";
    }
  }
}

function clearSearch() {
  currentRequest?.abort();
  currentRequest = undefined;
  input.value = "";
  errorMessage.textContent = "";
  results.replaceChildren();
  results.hidden = true;
  emptyState.hidden = false;
  searchButton.disabled = false;
  searchButton.textContent = "Search";
  clearButton.hidden = true;
  input.focus();
}

function showMessage(text, className) {
  const message = document.createElement("p");
  message.className = className;
  message.textContent = text;
  results.replaceChildren(message);
}

function showEntries(entries) {
  const cards = entries.map(createWordCard);
  results.replaceChildren(...cards);
}

function createWordCard(entry) {
  const card = document.createElement("article");
  card.className = "word-card";
  card.append(createWordHeading(entry));

  entry.meanings.forEach((meaning) => {
    card.append(createMeaning(meaning));
  });

  if (entry.sourceUrls?.length) {
    const sourceLink = document.createElement("a");
    sourceLink.className = "source-link";
    sourceLink.href = entry.sourceUrls[0];
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    sourceLink.textContent = "View source";
    card.append(sourceLink);
  }

  return card;
}

function createWordHeading(entry) {
  const heading = document.createElement("div");
  heading.className = "word-heading";

  const word = document.createElement("h2");
  word.textContent = entry.word || "Word";
  heading.append(word);

  const phonetic = entry.phonetic || entry.phonetics?.find((item) => item.text)?.text;
  const audioUrl = entry.phonetics?.find((item) => item.audio)?.audio;

  if (phonetic || audioUrl) {
    const pronunciation = document.createElement("div");
    pronunciation.className = "pronunciation";

    if (phonetic) {
      const phoneticText = document.createElement("span");
      phoneticText.textContent = phonetic;
      pronunciation.append(phoneticText);
    }

    if (audioUrl) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.preload = "none";
      audio.src = audioUrl;
      audio.setAttribute("aria-label", `Play pronunciation of ${entry.word || "word"}`);
      pronunciation.append(audio);
    }

    heading.append(pronunciation);
  }

  return heading;
}

function createMeaning(meaning) {
  const section = document.createElement("section");
  section.className = "meaning";

  const partOfSpeech = document.createElement("h3");
  partOfSpeech.textContent = meaning.partOfSpeech || "Meaning";
  section.append(partOfSpeech);

  const definitions = document.createElement("ol");
  definitions.className = "definitions";

  (meaning.definitions || []).forEach((item) => {
    if (!item.definition) return;

    const definition = document.createElement("li");
    const text = document.createElement("p");
    text.textContent = item.definition;
    definition.append(text);

    if (item.example) {
      const example = document.createElement("blockquote");
      example.textContent = `“${item.example}”`;
      definition.append(example);
    }

    definitions.append(definition);
  });

  if (definitions.childElementCount) {
    section.append(definitions);
  }

  const synonyms = new Set(meaning.synonyms || []);
  (meaning.definitions || []).forEach((item) => {
    (item.synonyms || []).forEach((synonym) => synonyms.add(synonym));
  });

  if (synonyms.size) {
    section.append(createSynonymList([...synonyms]));
  }

  return section;
}

function createSynonymList(synonyms) {
  const container = document.createElement("div");
  container.className = "synonyms";

  const label = document.createElement("h4");
  label.textContent = "Synonyms";
  container.append(label);

  const list = document.createElement("ul");
  synonyms.forEach((synonym) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "synonym-chip";
    button.textContent = synonym;
    button.addEventListener("click", () => {
      input.value = synonym;
      form.requestSubmit();
      input.focus();
    });
    item.append(button);
    list.append(item);
  });

  container.append(list);
  return container;
}
