// Strict, dependency-free HTML extraction for the build verifier.
// The scanner walks a document sequentially, consumes quoted attribute
// values and raw <script>/<style> bodies, and throws MalformedMarkupError
// instead of guessing whenever structure is ambiguous.

export class MalformedMarkupError extends Error {
  constructor(file, detail) {
    super(`${file}: ${detail}`);
    this.name = "MalformedMarkupError";
    this.file = file;
    this.detail = detail;
  }
}

const NAMED_ENTITIES = new Map([
  ["amp", "&"],
  ["lt", "<"],
  ["gt", ">"],
  ["quot", '"'],
  ["apos", "'"],
]);

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body) => {
    const named = NAMED_ENTITIES.get(body.toLowerCase());
    if (named !== undefined) {
      return named;
    }
    if (body.toLowerCase().startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
    }
    if (body.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
    }
    return match;
  });
}

export function normalizeText(fragment) {
  const withoutTags = fragment.replace(/<[^>]*>/g, " ");
  return decodeEntities(withoutTags).replace(/\s+/g, " ").trim();
}

function parseAttributes(html, from, file) {
  const attrs = new Map();
  let i = from;
  while (i < html.length) {
    while (i < html.length && /\s/.test(html[i])) {
      i += 1;
    }
    if (i >= html.length) {
      break;
    }
    if (html[i] === ">") {
      return { attrs, end: i + 1 };
    }
    if (html[i] === "/") {
      i += 1;
      continue;
    }
    let name = "";
    while (i < html.length && !/[\s=/>]/.test(html[i])) {
      name += html[i];
      i += 1;
    }
    if (name === "") {
      throw new MalformedMarkupError(file, `unparseable attribute near offset ${i}`);
    }
    while (i < html.length && /\s/.test(html[i])) {
      i += 1;
    }
    let value = "";
    if (html[i] === "=") {
      i += 1;
      while (i < html.length && /\s/.test(html[i])) {
        i += 1;
      }
      const quote = html[i];
      if (quote === '"' || quote === "'") {
        const close = html.indexOf(quote, i + 1);
        if (close === -1) {
          throw new MalformedMarkupError(file, `unterminated attribute quote near offset ${i}`);
        }
        value = html.slice(i + 1, close);
        i = close + 1;
      } else {
        while (i < html.length && !/[\s>]/.test(html[i])) {
          value += html[i];
          i += 1;
        }
      }
    }
    attrs.set(name.toLowerCase(), decodeEntities(value));
  }
  throw new MalformedMarkupError(file, `tag starting at offset ${from} never closed`);
}

function skipPast(html, from, marker, file, label) {
  const end = html.indexOf(marker, from);
  if (end === -1) {
    throw new MalformedMarkupError(file, `unterminated ${label} near offset ${from}`);
  }
  return end + marker.length;
}

// Yields { name, attrs, contentStart, body? } for every element tag.
// body is captured only for <script>/<style>, whose raw contents are
// consumed so markup-like text inside them is never misparsed.
export function* scanTags(html, file) {
  let i = 0;
  while (i < html.length) {
    const open = html.indexOf("<", i);
    if (open === -1) {
      return;
    }
    if (html.startsWith("<!--", open)) {
      i = skipPast(html, open + 4, "-->", file, "comment");
      continue;
    }
    if (html.startsWith("</", open) || html.startsWith("<!", open) || html.startsWith("<?", open)) {
      i = skipPast(html, open, ">", file, "closing tag or declaration");
      continue;
    }
    const nameMatch = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(html.slice(open, open + 40));
    if (!nameMatch) {
      i = open + 1;
      continue;
    }
    const name = nameMatch[1].toLowerCase();
    const { attrs, end } = parseAttributes(html, open + nameMatch[0].length, file);
    const tag = { name, attrs, contentStart: end };
    i = end;
    if (name === "script" || name === "style") {
      const close = html.toLowerCase().indexOf(`</${name}`, end);
      if (close === -1) {
        throw new MalformedMarkupError(file, `unterminated <${name}> near offset ${open}`);
      }
      tag.body = html.slice(end, close);
      i = skipPast(html, close, ">", file, `</${name}>`);
    }
    yield tag;
  }
}


