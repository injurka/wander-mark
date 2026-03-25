var Ne = Object.defineProperty;
var oe = (l) => {
  throw TypeError(l);
};
var Te = (l, n, t) => n in l ? Ne(l, n, { enumerable: !0, configurable: !0, writable: !0, value: t }) : l[n] = t;
var b = (l, n, t) => Te(l, typeof n != "symbol" ? n + "" : n, t), ze = (l, n, t) => n.has(l) || oe("Cannot " + t);
var ie = (l, n, t) => n.has(l) ? oe("Cannot add the same private member more than once") : n instanceof WeakSet ? n.add(l) : n.set(l, t);
var M = (l, n, t) => (ze(l, n, "access private method"), t);
function Q() {
  return {
    async: !1,
    breaks: !1,
    extensions: null,
    gfm: !0,
    hooks: null,
    pedantic: !1,
    renderer: null,
    silent: !1,
    tokenizer: null,
    walkTokens: null
  };
}
let T = Q();
function ue(l) {
  T = l;
}
const pe = /[&<>"']/, Ce = new RegExp(pe.source, "g"), we = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, _e = new RegExp(we.source, "g"), Be = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, re = (l) => Be[l];
function V(l, n) {
  if (n) {
    if (pe.test(l))
      return l.replace(Ce, re);
  } else if (we.test(l))
    return l.replace(_e, re);
  return l;
}
const Ie = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function Se(l) {
  return l.replace(Ie, (n, t) => (t = t.toLowerCase(), t === "colon" ? ":" : t.charAt(0) === "#" ? t.charAt(1) === "x" ? String.fromCharCode(parseInt(t.substring(2), 16)) : String.fromCharCode(+t.substring(1)) : ""));
}
const Me = /(^|[^\[])\^/g;
function m(l, n) {
  let t = typeof l == "string" ? l : l.source;
  n = n || "";
  const e = {
    replace: (o, r) => {
      let i = typeof r == "string" ? r : r.source;
      return i = i.replace(Me, "$1"), t = t.replace(o, i), e;
    },
    getRegex: () => new RegExp(t, n)
  };
  return e;
}
function se(l) {
  try {
    l = encodeURI(l).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return l;
}
const C = { exec: () => null };
function le(l, n) {
  const t = l.replace(/\|/g, (r, i, a) => {
    let c = !1, u = i;
    for (; --u >= 0 && a[u] === "\\"; )
      c = !c;
    return c ? "|" : " |";
  }), e = t.split(/ \|/);
  let o = 0;
  if (e[0].trim() || e.shift(), e.length > 0 && !e[e.length - 1].trim() && e.pop(), n)
    if (e.length > n)
      e.splice(n);
    else
      for (; e.length < n; )
        e.push("");
  for (; o < e.length; o++)
    e[o] = e[o].trim().replace(/\\\|/g, "|");
  return e;
}
function A(l, n, t) {
  const e = l.length;
  if (e === 0)
    return "";
  let o = 0;
  for (; o < e && l.charAt(e - o - 1) === n; )
    o++;
  return l.slice(0, e - o);
}
function Ae(l, n) {
  if (l.indexOf(n[1]) === -1)
    return -1;
  let t = 0;
  for (let e = 0; e < l.length; e++)
    if (l[e] === "\\")
      e++;
    else if (l[e] === n[0])
      t++;
    else if (l[e] === n[1] && (t--, t < 0))
      return e;
  return -1;
}
function ae(l, n, t, e) {
  const o = n.href, r = n.title ? V(n.title) : null, i = l[1].replace(/\\([\[\]])/g, "$1");
  if (l[0].charAt(0) !== "!") {
    e.state.inLink = !0;
    const a = {
      type: "link",
      raw: t,
      href: o,
      title: r,
      text: i,
      tokens: e.inlineTokens(i)
    };
    return e.state.inLink = !1, a;
  }
  return {
    type: "image",
    raw: t,
    href: o,
    title: r,
    text: V(i)
  };
}
function Pe(l, n) {
  const t = l.match(/^(\s+)(?:```)/);
  if (t === null)
    return n;
  const e = t[1];
  return n.split(`
`).map((o) => {
    const r = o.match(/^\s+/);
    if (r === null)
      return o;
    const [i] = r;
    return i.length >= e.length ? o.slice(e.length) : o;
  }).join(`
`);
}
class R {
  // set by the lexer
  constructor(n) {
    b(this, "options");
    b(this, "rules");
    // set by the lexer
    b(this, "lexer");
    this.options = n || T;
  }
  space(n) {
    const t = this.rules.block.newline.exec(n);
    if (t && t[0].length > 0)
      return {
        type: "space",
        raw: t[0]
      };
  }
  code(n) {
    const t = this.rules.block.code.exec(n);
    if (t) {
      const e = t[0].replace(/^ {1,4}/gm, "");
      return {
        type: "code",
        raw: t[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? e : A(e, `
`)
      };
    }
  }
  fences(n) {
    const t = this.rules.block.fences.exec(n);
    if (t) {
      const e = t[0], o = Pe(e, t[3] || "");
      return {
        type: "code",
        raw: e,
        lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2],
        text: o
      };
    }
  }
  heading(n) {
    const t = this.rules.block.heading.exec(n);
    if (t) {
      let e = t[2].trim();
      if (/#$/.test(e)) {
        const o = A(e, "#");
        (this.options.pedantic || !o || / $/.test(o)) && (e = o.trim());
      }
      return {
        type: "heading",
        raw: t[0],
        depth: t[1].length,
        text: e,
        tokens: this.lexer.inline(e)
      };
    }
  }
  hr(n) {
    const t = this.rules.block.hr.exec(n);
    if (t)
      return {
        type: "hr",
        raw: t[0]
      };
  }
  blockquote(n) {
    const t = this.rules.block.blockquote.exec(n);
    if (t) {
      let e = t[0].replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, `
    $1`);
      e = A(e.replace(/^ *>[ \t]?/gm, ""), `
`);
      const o = this.lexer.state.top;
      this.lexer.state.top = !0;
      const r = this.lexer.blockTokens(e);
      return this.lexer.state.top = o, {
        type: "blockquote",
        raw: t[0],
        tokens: r,
        text: e
      };
    }
  }
  list(n) {
    let t = this.rules.block.list.exec(n);
    if (t) {
      let e = t[1].trim();
      const o = e.length > 1, r = {
        type: "list",
        raw: "",
        ordered: o,
        start: o ? +e.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      e = o ? `\\d{1,9}\\${e.slice(-1)}` : `\\${e}`, this.options.pedantic && (e = o ? e : "[*+-]");
      const i = new RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`);
      let a = "", c = "", u = !1;
      for (; n; ) {
        let d = !1;
        if (!(t = i.exec(n)) || this.rules.block.hr.test(n))
          break;
        a = t[0], n = n.substring(a.length);
        let h = t[2].split(`
`, 1)[0].replace(/^\t+/, (q) => " ".repeat(3 * q.length)), p = n.split(`
`, 1)[0], w = 0;
        this.options.pedantic ? (w = 2, c = h.trimStart()) : (w = t[2].search(/[^ ]/), w = w > 4 ? 1 : w, c = h.slice(w), w += t[1].length);
        let g = !1;
        if (!h && /^ *$/.test(p) && (a += p + `
`, n = n.substring(p.length + 1), d = !0), !d) {
          const q = new RegExp(`^ {0,${Math.min(3, w - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), ee = new RegExp(`^ {0,${Math.min(3, w - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), te = new RegExp(`^ {0,${Math.min(3, w - 1)}}(?:\`\`\`|~~~)`), ne = new RegExp(`^ {0,${Math.min(3, w - 1)}}#`);
          for (; n; ) {
            const H = n.split(`
`, 1)[0];
            if (p = H, this.options.pedantic && (p = p.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  ")), te.test(p) || ne.test(p) || q.test(p) || ee.test(n))
              break;
            if (p.search(/[^ ]/) >= w || !p.trim())
              c += `
` + p.slice(w);
            else {
              if (g || h.search(/[^ ]/) >= 4 || te.test(h) || ne.test(h) || ee.test(h))
                break;
              c += `
` + p;
            }
            !g && !p.trim() && (g = !0), a += H + `
`, n = n.substring(H.length + 1), h = p.slice(w);
          }
        }
        r.loose || (u ? r.loose = !0 : /\n *\n *$/.test(a) && (u = !0));
        let k = null, E;
        this.options.gfm && (k = /^\[[ xX]\] /.exec(c), k && (E = k[0] !== "[ ] ", c = c.replace(/^\[[ xX]\] +/, ""))), r.items.push({
          type: "list_item",
          raw: a,
          task: !!k,
          checked: E,
          loose: !1,
          text: c,
          tokens: []
        }), r.raw += a;
      }
      r.items[r.items.length - 1].raw = a.trimEnd(), r.items[r.items.length - 1].text = c.trimEnd(), r.raw = r.raw.trimEnd();
      for (let d = 0; d < r.items.length; d++)
        if (this.lexer.state.top = !1, r.items[d].tokens = this.lexer.blockTokens(r.items[d].text, []), !r.loose) {
          const h = r.items[d].tokens.filter((w) => w.type === "space"), p = h.length > 0 && h.some((w) => /\n.*\n/.test(w.raw));
          r.loose = p;
        }
      if (r.loose)
        for (let d = 0; d < r.items.length; d++)
          r.items[d].loose = !0;
      return r;
    }
  }
  html(n) {
    const t = this.rules.block.html.exec(n);
    if (t)
      return {
        type: "html",
        block: !0,
        raw: t[0],
        pre: t[1] === "pre" || t[1] === "script" || t[1] === "style",
        text: t[0]
      };
  }
  def(n) {
    const t = this.rules.block.def.exec(n);
    if (t) {
      const e = t[1].toLowerCase().replace(/\s+/g, " "), o = t[2] ? t[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return {
        type: "def",
        tag: e,
        raw: t[0],
        href: o,
        title: r
      };
    }
  }
  table(n) {
    const t = this.rules.block.table.exec(n);
    if (!t || !/[:|]/.test(t[2]))
      return;
    const e = le(t[1]), o = t[2].replace(/^\||\| *$/g, "").split("|"), r = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split(`
`) : [], i = {
      type: "table",
      raw: t[0],
      header: [],
      align: [],
      rows: []
    };
    if (e.length === o.length) {
      for (const a of o)
        /^ *-+: *$/.test(a) ? i.align.push("right") : /^ *:-+: *$/.test(a) ? i.align.push("center") : /^ *:-+ *$/.test(a) ? i.align.push("left") : i.align.push(null);
      for (const a of e)
        i.header.push({
          text: a,
          tokens: this.lexer.inline(a)
        });
      for (const a of r)
        i.rows.push(le(a, i.header.length).map((c) => ({
          text: c,
          tokens: this.lexer.inline(c)
        })));
      return i;
    }
  }
  lheading(n) {
    const t = this.rules.block.lheading.exec(n);
    if (t)
      return {
        type: "heading",
        raw: t[0],
        depth: t[2].charAt(0) === "=" ? 1 : 2,
        text: t[1],
        tokens: this.lexer.inline(t[1])
      };
  }
  paragraph(n) {
    const t = this.rules.block.paragraph.exec(n);
    if (t) {
      const e = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return {
        type: "paragraph",
        raw: t[0],
        text: e,
        tokens: this.lexer.inline(e)
      };
    }
  }
  text(n) {
    const t = this.rules.block.text.exec(n);
    if (t)
      return {
        type: "text",
        raw: t[0],
        text: t[0],
        tokens: this.lexer.inline(t[0])
      };
  }
  escape(n) {
    const t = this.rules.inline.escape.exec(n);
    if (t)
      return {
        type: "escape",
        raw: t[0],
        text: V(t[1])
      };
  }
  tag(n) {
    const t = this.rules.inline.tag.exec(n);
    if (t)
      return !this.lexer.state.inLink && /^<a /i.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && /^<\/a>/i.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(t[0]) && (this.lexer.state.inRawBlock = !1), {
        type: "html",
        raw: t[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        block: !1,
        text: t[0]
      };
  }
  link(n) {
    const t = this.rules.inline.link.exec(n);
    if (t) {
      const e = t[2].trim();
      if (!this.options.pedantic && /^</.test(e)) {
        if (!/>$/.test(e))
          return;
        const i = A(e.slice(0, -1), "\\");
        if ((e.length - i.length) % 2 === 0)
          return;
      } else {
        const i = Ae(t[2], "()");
        if (i > -1) {
          const c = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + i;
          t[2] = t[2].substring(0, i), t[0] = t[0].substring(0, c).trim(), t[3] = "";
        }
      }
      let o = t[2], r = "";
      if (this.options.pedantic) {
        const i = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(o);
        i && (o = i[1], r = i[3]);
      } else
        r = t[3] ? t[3].slice(1, -1) : "";
      return o = o.trim(), /^</.test(o) && (this.options.pedantic && !/>$/.test(e) ? o = o.slice(1) : o = o.slice(1, -1)), ae(t, {
        href: o && o.replace(this.rules.inline.anyPunctuation, "$1"),
        title: r && r.replace(this.rules.inline.anyPunctuation, "$1")
      }, t[0], this.lexer);
    }
  }
  reflink(n, t) {
    let e;
    if ((e = this.rules.inline.reflink.exec(n)) || (e = this.rules.inline.nolink.exec(n))) {
      const o = (e[2] || e[1]).replace(/\s+/g, " "), r = t[o.toLowerCase()];
      if (!r) {
        const i = e[0].charAt(0);
        return {
          type: "text",
          raw: i,
          text: i
        };
      }
      return ae(e, r, e[0], this.lexer);
    }
  }
  emStrong(n, t, e = "") {
    let o = this.rules.inline.emStrongLDelim.exec(n);
    if (!o || o[3] && e.match(/[\p{L}\p{N}]/u))
      return;
    if (!(o[1] || o[2] || "") || !e || this.rules.inline.punctuation.exec(e)) {
      const i = [...o[0]].length - 1;
      let a, c, u = i, d = 0;
      const h = o[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (h.lastIndex = 0, t = t.slice(-1 * n.length + i); (o = h.exec(t)) != null; ) {
        if (a = o[1] || o[2] || o[3] || o[4] || o[5] || o[6], !a)
          continue;
        if (c = [...a].length, o[3] || o[4]) {
          u += c;
          continue;
        } else if ((o[5] || o[6]) && i % 3 && !((i + c) % 3)) {
          d += c;
          continue;
        }
        if (u -= c, u > 0)
          continue;
        c = Math.min(c, c + u + d);
        const p = [...o[0]][0].length, w = n.slice(0, i + o.index + p + c);
        if (Math.min(i, c) % 2) {
          const k = w.slice(1, -1);
          return {
            type: "em",
            raw: w,
            text: k,
            tokens: this.lexer.inlineTokens(k)
          };
        }
        const g = w.slice(2, -2);
        return {
          type: "strong",
          raw: w,
          text: g,
          tokens: this.lexer.inlineTokens(g)
        };
      }
    }
  }
  codespan(n) {
    const t = this.rules.inline.code.exec(n);
    if (t) {
      let e = t[2].replace(/\n/g, " ");
      const o = /[^ ]/.test(e), r = /^ /.test(e) && / $/.test(e);
      return o && r && (e = e.substring(1, e.length - 1)), e = V(e, !0), {
        type: "codespan",
        raw: t[0],
        text: e
      };
    }
  }
  br(n) {
    const t = this.rules.inline.br.exec(n);
    if (t)
      return {
        type: "br",
        raw: t[0]
      };
  }
  del(n) {
    const t = this.rules.inline.del.exec(n);
    if (t)
      return {
        type: "del",
        raw: t[0],
        text: t[2],
        tokens: this.lexer.inlineTokens(t[2])
      };
  }
  autolink(n) {
    const t = this.rules.inline.autolink.exec(n);
    if (t) {
      let e, o;
      return t[2] === "@" ? (e = V(t[1]), o = "mailto:" + e) : (e = V(t[1]), o = e), {
        type: "link",
        raw: t[0],
        text: e,
        href: o,
        tokens: [
          {
            type: "text",
            raw: e,
            text: e
          }
        ]
      };
    }
  }
  url(n) {
    var e;
    let t;
    if (t = this.rules.inline.url.exec(n)) {
      let o, r;
      if (t[2] === "@")
        o = V(t[0]), r = "mailto:" + o;
      else {
        let i;
        do
          i = t[0], t[0] = ((e = this.rules.inline._backpedal.exec(t[0])) == null ? void 0 : e[0]) ?? "";
        while (i !== t[0]);
        o = V(t[0]), t[1] === "www." ? r = "http://" + t[0] : r = t[0];
      }
      return {
        type: "link",
        raw: t[0],
        text: o,
        href: r,
        tokens: [
          {
            type: "text",
            raw: o,
            text: o
          }
        ]
      };
    }
  }
  inlineText(n) {
    const t = this.rules.inline.text.exec(n);
    if (t) {
      let e;
      return this.lexer.state.inRawBlock ? e = t[0] : e = V(t[0]), {
        type: "text",
        raw: t[0],
        text: e
      };
    }
  }
}
const Re = /^(?: *(?:\n|$))+/, Le = /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/, De = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, I = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, je = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, he = /(?:[*+-]|\d{1,9}[.)])/, ge = m(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, he).replace(/blockCode/g, / {4}/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), K = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, qe = /^[^\n]+/, U = /(?!\s*\])(?:\\.|[^\[\]\\])+/, He = m(/^ {0,3}\[(label)\]: *(?:\n *)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/).replace("label", U).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Oe = m(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, he).getRegex(), j = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", J = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Ze = m("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$))", "i").replace("comment", J).replace("tag", j).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), fe = m(K).replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", j).getRegex(), Fe = m(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", fe).getRegex(), G = {
  blockquote: Fe,
  code: Le,
  def: He,
  fences: De,
  heading: je,
  hr: I,
  html: Ze,
  lheading: ge,
  list: Oe,
  newline: Re,
  paragraph: fe,
  table: C,
  text: qe
}, ce = m("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", " {4}[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", j).getRegex(), Qe = {
  ...G,
  table: ce,
  paragraph: m(K).replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", ce).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", j).getRegex()
}, Ke = {
  ...G,
  html: m(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", J).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: C,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: m(K).replace("hr", I).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ge).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, me = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Ue = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, be = /^( {2,}|\\)\n(?!\s*$)/, Je = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, S = "\\p{P}\\p{S}", Ge = m(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, S).getRegex(), We = /\[[^[\]]*?\]\([^\(\)]*?\)|`[^`]*?`|<[^<>]*?>/g, Xe = m(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, S).getRegex(), Ye = m("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, S).getRegex(), et = m("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, S).getRegex(), tt = m(/\\([punct])/, "gu").replace(/punct/g, S).getRegex(), nt = m(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), ot = m(J).replace("(?:-->|$)", "-->").getRegex(), it = m("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", ot).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), L = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, rt = m(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", L).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), xe = m(/^!?\[(label)\]\[(ref)\]/).replace("label", L).replace("ref", U).getRegex(), ke = m(/^!?\[(ref)\](?:\[\])?/).replace("ref", U).getRegex(), st = m("reflink|nolink(?!\\()", "g").replace("reflink", xe).replace("nolink", ke).getRegex(), W = {
  _backpedal: C,
  // only used for GFM url
  anyPunctuation: tt,
  autolink: nt,
  blockSkip: We,
  br: be,
  code: Ue,
  del: C,
  emStrongLDelim: Xe,
  emStrongRDelimAst: Ye,
  emStrongRDelimUnd: et,
  escape: me,
  link: rt,
  nolink: ke,
  punctuation: Ge,
  reflink: xe,
  reflinkSearch: st,
  tag: it,
  text: Je,
  url: C
}, lt = {
  ...W,
  link: m(/^!?\[(label)\]\((.*?)\)/).replace("label", L).getRegex(),
  reflink: m(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", L).getRegex()
}, Z = {
  ...W,
  escape: m(me).replace("])", "~|])").getRegex(),
  url: m(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, at = {
  ...Z,
  br: m(be).replace("{2,}", "*").getRegex(),
  text: m(Z.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, P = {
  normal: G,
  gfm: Qe,
  pedantic: Ke
}, z = {
  normal: W,
  gfm: Z,
  breaks: at,
  pedantic: lt
};
class v {
  constructor(n) {
    b(this, "tokens");
    b(this, "options");
    b(this, "state");
    b(this, "tokenizer");
    b(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = n || T, this.options.tokenizer = this.options.tokenizer || new R(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const t = {
      block: P.normal,
      inline: z.normal
    };
    this.options.pedantic ? (t.block = P.pedantic, t.inline = z.pedantic) : this.options.gfm && (t.block = P.gfm, this.options.breaks ? t.inline = z.breaks : t.inline = z.gfm), this.tokenizer.rules = t;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: P,
      inline: z
    };
  }
  /**
   * Static Lex Method
   */
  static lex(n, t) {
    return new v(t).lex(n);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(n, t) {
    return new v(t).inlineTokens(n);
  }
  /**
   * Preprocessing
   */
  lex(n) {
    n = n.replace(/\r\n|\r/g, `
`), this.blockTokens(n, this.tokens);
    for (let t = 0; t < this.inlineQueue.length; t++) {
      const e = this.inlineQueue[t];
      this.inlineTokens(e.src, e.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(n, t = []) {
    this.options.pedantic ? n = n.replace(/\t/g, "    ").replace(/^ +$/gm, "") : n = n.replace(/^( *)(\t+)/gm, (a, c, u) => c + "    ".repeat(u.length));
    let e, o, r, i;
    for (; n; )
      if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((a) => (e = a.call({ lexer: this }, n, t)) ? (n = n.substring(e.raw.length), t.push(e), !0) : !1))) {
        if (e = this.tokenizer.space(n)) {
          n = n.substring(e.raw.length), e.raw.length === 1 && t.length > 0 ? t[t.length - 1].raw += `
` : t.push(e);
          continue;
        }
        if (e = this.tokenizer.code(n)) {
          n = n.substring(e.raw.length), o = t[t.length - 1], o && (o.type === "paragraph" || o.type === "text") ? (o.raw += `
` + e.raw, o.text += `
` + e.text, this.inlineQueue[this.inlineQueue.length - 1].src = o.text) : t.push(e);
          continue;
        }
        if (e = this.tokenizer.fences(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.heading(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.hr(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.blockquote(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.list(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.html(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.def(n)) {
          n = n.substring(e.raw.length), o = t[t.length - 1], o && (o.type === "paragraph" || o.type === "text") ? (o.raw += `
` + e.raw, o.text += `
` + e.raw, this.inlineQueue[this.inlineQueue.length - 1].src = o.text) : this.tokens.links[e.tag] || (this.tokens.links[e.tag] = {
            href: e.href,
            title: e.title
          });
          continue;
        }
        if (e = this.tokenizer.table(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.lheading(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (r = n, this.options.extensions && this.options.extensions.startBlock) {
          let a = 1 / 0;
          const c = n.slice(1);
          let u;
          this.options.extensions.startBlock.forEach((d) => {
            u = d.call({ lexer: this }, c), typeof u == "number" && u >= 0 && (a = Math.min(a, u));
          }), a < 1 / 0 && a >= 0 && (r = n.substring(0, a + 1));
        }
        if (this.state.top && (e = this.tokenizer.paragraph(r))) {
          o = t[t.length - 1], i && o.type === "paragraph" ? (o.raw += `
` + e.raw, o.text += `
` + e.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = o.text) : t.push(e), i = r.length !== n.length, n = n.substring(e.raw.length);
          continue;
        }
        if (e = this.tokenizer.text(n)) {
          n = n.substring(e.raw.length), o = t[t.length - 1], o && o.type === "text" ? (o.raw += `
` + e.raw, o.text += `
` + e.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = o.text) : t.push(e);
          continue;
        }
        if (n) {
          const a = "Infinite loop on byte: " + n.charCodeAt(0);
          if (this.options.silent) {
            console.error(a);
            break;
          } else
            throw new Error(a);
        }
      }
    return this.state.top = !0, t;
  }
  inline(n, t = []) {
    return this.inlineQueue.push({ src: n, tokens: t }), t;
  }
  /**
   * Lexing/Compiling
   */
  inlineTokens(n, t = []) {
    let e, o, r, i = n, a, c, u;
    if (this.tokens.links) {
      const d = Object.keys(this.tokens.links);
      if (d.length > 0)
        for (; (a = this.tokenizer.rules.inline.reflinkSearch.exec(i)) != null; )
          d.includes(a[0].slice(a[0].lastIndexOf("[") + 1, -1)) && (i = i.slice(0, a.index) + "[" + "a".repeat(a[0].length - 2) + "]" + i.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (a = this.tokenizer.rules.inline.blockSkip.exec(i)) != null; )
      i = i.slice(0, a.index) + "[" + "a".repeat(a[0].length - 2) + "]" + i.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (a = this.tokenizer.rules.inline.anyPunctuation.exec(i)) != null; )
      i = i.slice(0, a.index) + "++" + i.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; n; )
      if (c || (u = ""), c = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((d) => (e = d.call({ lexer: this }, n, t)) ? (n = n.substring(e.raw.length), t.push(e), !0) : !1))) {
        if (e = this.tokenizer.escape(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.tag(n)) {
          n = n.substring(e.raw.length), o = t[t.length - 1], o && e.type === "text" && o.type === "text" ? (o.raw += e.raw, o.text += e.text) : t.push(e);
          continue;
        }
        if (e = this.tokenizer.link(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.reflink(n, this.tokens.links)) {
          n = n.substring(e.raw.length), o = t[t.length - 1], o && e.type === "text" && o.type === "text" ? (o.raw += e.raw, o.text += e.text) : t.push(e);
          continue;
        }
        if (e = this.tokenizer.emStrong(n, i, u)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.codespan(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.br(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.del(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (e = this.tokenizer.autolink(n)) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (!this.state.inLink && (e = this.tokenizer.url(n))) {
          n = n.substring(e.raw.length), t.push(e);
          continue;
        }
        if (r = n, this.options.extensions && this.options.extensions.startInline) {
          let d = 1 / 0;
          const h = n.slice(1);
          let p;
          this.options.extensions.startInline.forEach((w) => {
            p = w.call({ lexer: this }, h), typeof p == "number" && p >= 0 && (d = Math.min(d, p));
          }), d < 1 / 0 && d >= 0 && (r = n.substring(0, d + 1));
        }
        if (e = this.tokenizer.inlineText(r)) {
          n = n.substring(e.raw.length), e.raw.slice(-1) !== "_" && (u = e.raw.slice(-1)), c = !0, o = t[t.length - 1], o && o.type === "text" ? (o.raw += e.raw, o.text += e.text) : t.push(e);
          continue;
        }
        if (n) {
          const d = "Infinite loop on byte: " + n.charCodeAt(0);
          if (this.options.silent) {
            console.error(d);
            break;
          } else
            throw new Error(d);
        }
      }
    return t;
  }
}
class D {
  constructor(n) {
    b(this, "options");
    this.options = n || T;
  }
  code(n, t, e) {
    var r;
    const o = (r = (t || "").match(/^\S*/)) == null ? void 0 : r[0];
    return n = n.replace(/\n$/, "") + `
`, o ? '<pre><code class="language-' + V(o) + '">' + (e ? n : V(n, !0)) + `</code></pre>
` : "<pre><code>" + (e ? n : V(n, !0)) + `</code></pre>
`;
  }
  blockquote(n) {
    return `<blockquote>
${n}</blockquote>
`;
  }
  html(n, t) {
    return n;
  }
  heading(n, t, e) {
    return `<h${t}>${n}</h${t}>
`;
  }
  hr() {
    return `<hr>
`;
  }
  list(n, t, e) {
    const o = t ? "ol" : "ul", r = t && e !== 1 ? ' start="' + e + '"' : "";
    return "<" + o + r + `>
` + n + "</" + o + `>
`;
  }
  listitem(n, t, e) {
    return `<li>${n}</li>
`;
  }
  checkbox(n) {
    return "<input " + (n ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph(n) {
    return `<p>${n}</p>
`;
  }
  table(n, t) {
    return t && (t = `<tbody>${t}</tbody>`), `<table>
<thead>
` + n + `</thead>
` + t + `</table>
`;
  }
  tablerow(n) {
    return `<tr>
${n}</tr>
`;
  }
  tablecell(n, t) {
    const e = t.header ? "th" : "td";
    return (t.align ? `<${e} align="${t.align}">` : `<${e}>`) + n + `</${e}>
`;
  }
  /**
   * span level renderer
   */
  strong(n) {
    return `<strong>${n}</strong>`;
  }
  em(n) {
    return `<em>${n}</em>`;
  }
  codespan(n) {
    return `<code>${n}</code>`;
  }
  br() {
    return "<br>";
  }
  del(n) {
    return `<del>${n}</del>`;
  }
  link(n, t, e) {
    const o = se(n);
    if (o === null)
      return e;
    n = o;
    let r = '<a href="' + n + '"';
    return t && (r += ' title="' + t + '"'), r += ">" + e + "</a>", r;
  }
  image(n, t, e) {
    const o = se(n);
    if (o === null)
      return e;
    n = o;
    let r = `<img src="${n}" alt="${e}"`;
    return t && (r += ` title="${t}"`), r += ">", r;
  }
  text(n) {
    return n;
  }
}
class X {
  // no need for block level renderers
  strong(n) {
    return n;
  }
  em(n) {
    return n;
  }
  codespan(n) {
    return n;
  }
  del(n) {
    return n;
  }
  html(n) {
    return n;
  }
  text(n) {
    return n;
  }
  link(n, t, e) {
    return "" + e;
  }
  image(n, t, e) {
    return "" + e;
  }
  br() {
    return "";
  }
}
class y {
  constructor(n) {
    b(this, "options");
    b(this, "renderer");
    b(this, "textRenderer");
    this.options = n || T, this.options.renderer = this.options.renderer || new D(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.textRenderer = new X();
  }
  /**
   * Static Parse Method
   */
  static parse(n, t) {
    return new y(t).parse(n);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(n, t) {
    return new y(t).parseInline(n);
  }
  /**
   * Parse Loop
   */
  parse(n, t = !0) {
    let e = "";
    for (let o = 0; o < n.length; o++) {
      const r = n[o];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[r.type]) {
        const i = r, a = this.options.extensions.renderers[i.type].call({ parser: this }, i);
        if (a !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(i.type)) {
          e += a || "";
          continue;
        }
      }
      switch (r.type) {
        case "space":
          continue;
        case "hr": {
          e += this.renderer.hr();
          continue;
        }
        case "heading": {
          const i = r;
          e += this.renderer.heading(this.parseInline(i.tokens), i.depth, Se(this.parseInline(i.tokens, this.textRenderer)));
          continue;
        }
        case "code": {
          const i = r;
          e += this.renderer.code(i.text, i.lang, !!i.escaped);
          continue;
        }
        case "table": {
          const i = r;
          let a = "", c = "";
          for (let d = 0; d < i.header.length; d++)
            c += this.renderer.tablecell(this.parseInline(i.header[d].tokens), { header: !0, align: i.align[d] });
          a += this.renderer.tablerow(c);
          let u = "";
          for (let d = 0; d < i.rows.length; d++) {
            const h = i.rows[d];
            c = "";
            for (let p = 0; p < h.length; p++)
              c += this.renderer.tablecell(this.parseInline(h[p].tokens), { header: !1, align: i.align[p] });
            u += this.renderer.tablerow(c);
          }
          e += this.renderer.table(a, u);
          continue;
        }
        case "blockquote": {
          const i = r, a = this.parse(i.tokens);
          e += this.renderer.blockquote(a);
          continue;
        }
        case "list": {
          const i = r, a = i.ordered, c = i.start, u = i.loose;
          let d = "";
          for (let h = 0; h < i.items.length; h++) {
            const p = i.items[h], w = p.checked, g = p.task;
            let k = "";
            if (p.task) {
              const E = this.renderer.checkbox(!!w);
              u ? p.tokens.length > 0 && p.tokens[0].type === "paragraph" ? (p.tokens[0].text = E + " " + p.tokens[0].text, p.tokens[0].tokens && p.tokens[0].tokens.length > 0 && p.tokens[0].tokens[0].type === "text" && (p.tokens[0].tokens[0].text = E + " " + p.tokens[0].tokens[0].text)) : p.tokens.unshift({
                type: "text",
                text: E + " "
              }) : k += E + " ";
            }
            k += this.parse(p.tokens, u), d += this.renderer.listitem(k, g, !!w);
          }
          e += this.renderer.list(d, a, c);
          continue;
        }
        case "html": {
          const i = r;
          e += this.renderer.html(i.text, i.block);
          continue;
        }
        case "paragraph": {
          const i = r;
          e += this.renderer.paragraph(this.parseInline(i.tokens));
          continue;
        }
        case "text": {
          let i = r, a = i.tokens ? this.parseInline(i.tokens) : i.text;
          for (; o + 1 < n.length && n[o + 1].type === "text"; )
            i = n[++o], a += `
` + (i.tokens ? this.parseInline(i.tokens) : i.text);
          e += t ? this.renderer.paragraph(a) : a;
          continue;
        }
        default: {
          const i = 'Token with "' + r.type + '" type was not found.';
          if (this.options.silent)
            return console.error(i), "";
          throw new Error(i);
        }
      }
    }
    return e;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(n, t) {
    t = t || this.renderer;
    let e = "";
    for (let o = 0; o < n.length; o++) {
      const r = n[o];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[r.type]) {
        const i = this.options.extensions.renderers[r.type].call({ parser: this }, r);
        if (i !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(r.type)) {
          e += i || "";
          continue;
        }
      }
      switch (r.type) {
        case "escape": {
          const i = r;
          e += t.text(i.text);
          break;
        }
        case "html": {
          const i = r;
          e += t.html(i.text);
          break;
        }
        case "link": {
          const i = r;
          e += t.link(i.href, i.title, this.parseInline(i.tokens, t));
          break;
        }
        case "image": {
          const i = r;
          e += t.image(i.href, i.title, i.text);
          break;
        }
        case "strong": {
          const i = r;
          e += t.strong(this.parseInline(i.tokens, t));
          break;
        }
        case "em": {
          const i = r;
          e += t.em(this.parseInline(i.tokens, t));
          break;
        }
        case "codespan": {
          const i = r;
          e += t.codespan(i.text);
          break;
        }
        case "br": {
          e += t.br();
          break;
        }
        case "del": {
          const i = r;
          e += t.del(this.parseInline(i.tokens, t));
          break;
        }
        case "text": {
          const i = r;
          e += t.text(i.text);
          break;
        }
        default: {
          const i = 'Token with "' + r.type + '" type was not found.';
          if (this.options.silent)
            return console.error(i), "";
          throw new Error(i);
        }
      }
    }
    return e;
  }
}
class _ {
  constructor(n) {
    b(this, "options");
    this.options = n || T;
  }
  /**
   * Process markdown before marked
   */
  preprocess(n) {
    return n;
  }
  /**
   * Process HTML after marked is finished
   */
  postprocess(n) {
    return n;
  }
  /**
   * Process all tokens before walk tokens
   */
  processAllTokens(n) {
    return n;
  }
}
b(_, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
var N, F, Ve;
class ct {
  constructor(...n) {
    ie(this, N);
    b(this, "defaults", Q());
    b(this, "options", this.setOptions);
    b(this, "parse", M(this, N, F).call(this, v.lex, y.parse));
    b(this, "parseInline", M(this, N, F).call(this, v.lexInline, y.parseInline));
    b(this, "Parser", y);
    b(this, "Renderer", D);
    b(this, "TextRenderer", X);
    b(this, "Lexer", v);
    b(this, "Tokenizer", R);
    b(this, "Hooks", _);
    this.use(...n);
  }
  /**
   * Run callback for every token
   */
  walkTokens(n, t) {
    var o, r;
    let e = [];
    for (const i of n)
      switch (e = e.concat(t.call(this, i)), i.type) {
        case "table": {
          const a = i;
          for (const c of a.header)
            e = e.concat(this.walkTokens(c.tokens, t));
          for (const c of a.rows)
            for (const u of c)
              e = e.concat(this.walkTokens(u.tokens, t));
          break;
        }
        case "list": {
          const a = i;
          e = e.concat(this.walkTokens(a.items, t));
          break;
        }
        default: {
          const a = i;
          (r = (o = this.defaults.extensions) == null ? void 0 : o.childTokens) != null && r[a.type] ? this.defaults.extensions.childTokens[a.type].forEach((c) => {
            const u = a[c].flat(1 / 0);
            e = e.concat(this.walkTokens(u, t));
          }) : a.tokens && (e = e.concat(this.walkTokens(a.tokens, t)));
        }
      }
    return e;
  }
  use(...n) {
    const t = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return n.forEach((e) => {
      const o = { ...e };
      if (o.async = this.defaults.async || o.async || !1, e.extensions && (e.extensions.forEach((r) => {
        if (!r.name)
          throw new Error("extension name required");
        if ("renderer" in r) {
          const i = t.renderers[r.name];
          i ? t.renderers[r.name] = function(...a) {
            let c = r.renderer.apply(this, a);
            return c === !1 && (c = i.apply(this, a)), c;
          } : t.renderers[r.name] = r.renderer;
        }
        if ("tokenizer" in r) {
          if (!r.level || r.level !== "block" && r.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const i = t[r.level];
          i ? i.unshift(r.tokenizer) : t[r.level] = [r.tokenizer], r.start && (r.level === "block" ? t.startBlock ? t.startBlock.push(r.start) : t.startBlock = [r.start] : r.level === "inline" && (t.startInline ? t.startInline.push(r.start) : t.startInline = [r.start]));
        }
        "childTokens" in r && r.childTokens && (t.childTokens[r.name] = r.childTokens);
      }), o.extensions = t), e.renderer) {
        const r = this.defaults.renderer || new D(this.defaults);
        for (const i in e.renderer) {
          if (!(i in r))
            throw new Error(`renderer '${i}' does not exist`);
          if (i === "options")
            continue;
          const a = i, c = e.renderer[a], u = r[a];
          r[a] = (...d) => {
            let h = c.apply(r, d);
            return h === !1 && (h = u.apply(r, d)), h || "";
          };
        }
        o.renderer = r;
      }
      if (e.tokenizer) {
        const r = this.defaults.tokenizer || new R(this.defaults);
        for (const i in e.tokenizer) {
          if (!(i in r))
            throw new Error(`tokenizer '${i}' does not exist`);
          if (["options", "rules", "lexer"].includes(i))
            continue;
          const a = i, c = e.tokenizer[a], u = r[a];
          r[a] = (...d) => {
            let h = c.apply(r, d);
            return h === !1 && (h = u.apply(r, d)), h;
          };
        }
        o.tokenizer = r;
      }
      if (e.hooks) {
        const r = this.defaults.hooks || new _();
        for (const i in e.hooks) {
          if (!(i in r))
            throw new Error(`hook '${i}' does not exist`);
          if (i === "options")
            continue;
          const a = i, c = e.hooks[a], u = r[a];
          _.passThroughHooks.has(i) ? r[a] = (d) => {
            if (this.defaults.async)
              return Promise.resolve(c.call(r, d)).then((p) => u.call(r, p));
            const h = c.call(r, d);
            return u.call(r, h);
          } : r[a] = (...d) => {
            let h = c.apply(r, d);
            return h === !1 && (h = u.apply(r, d)), h;
          };
        }
        o.hooks = r;
      }
      if (e.walkTokens) {
        const r = this.defaults.walkTokens, i = e.walkTokens;
        o.walkTokens = function(a) {
          let c = [];
          return c.push(i.call(this, a)), r && (c = c.concat(r.call(this, a))), c;
        };
      }
      this.defaults = { ...this.defaults, ...o };
    }), this;
  }
  setOptions(n) {
    return this.defaults = { ...this.defaults, ...n }, this;
  }
  lexer(n, t) {
    return v.lex(n, t ?? this.defaults);
  }
  parser(n, t) {
    return y.parse(n, t ?? this.defaults);
  }
}
N = new WeakSet(), F = function(n, t) {
  return (e, o) => {
    const r = { ...o }, i = { ...this.defaults, ...r };
    this.defaults.async === !0 && r.async === !1 && (i.silent || console.warn("marked(): The async option was set to true by an extension. The async: false option sent to parse will be ignored."), i.async = !0);
    const a = M(this, N, Ve).call(this, !!i.silent, !!i.async);
    if (typeof e > "u" || e === null)
      return a(new Error("marked(): input parameter is undefined or null"));
    if (typeof e != "string")
      return a(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(e) + ", string expected"));
    if (i.hooks && (i.hooks.options = i), i.async)
      return Promise.resolve(i.hooks ? i.hooks.preprocess(e) : e).then((c) => n(c, i)).then((c) => i.hooks ? i.hooks.processAllTokens(c) : c).then((c) => i.walkTokens ? Promise.all(this.walkTokens(c, i.walkTokens)).then(() => c) : c).then((c) => t(c, i)).then((c) => i.hooks ? i.hooks.postprocess(c) : c).catch(a);
    try {
      i.hooks && (e = i.hooks.preprocess(e));
      let c = n(e, i);
      i.hooks && (c = i.hooks.processAllTokens(c)), i.walkTokens && this.walkTokens(c, i.walkTokens);
      let u = t(c, i);
      return i.hooks && (u = i.hooks.postprocess(u)), u;
    } catch (c) {
      return a(c);
    }
  };
}, Ve = function(n, t) {
  return (e) => {
    if (e.message += `
Please report this to https://github.com/markedjs/marked.`, n) {
      const o = "<p>An error occurred:</p><pre>" + V(e.message + "", !0) + "</pre>";
      return t ? Promise.resolve(o) : o;
    }
    if (t)
      return Promise.reject(e);
    throw e;
  };
};
const $ = new ct();
function f(l, n) {
  return $.parse(l, n);
}
f.options = f.setOptions = function(l) {
  return $.setOptions(l), f.defaults = $.defaults, ue(f.defaults), f;
};
f.getDefaults = Q;
f.defaults = T;
f.use = function(...l) {
  return $.use(...l), f.defaults = $.defaults, ue(f.defaults), f;
};
f.walkTokens = function(l, n) {
  return $.walkTokens(l, n);
};
f.parseInline = $.parseInline;
f.Parser = y;
f.parser = y.parse;
f.Renderer = D;
f.TextRenderer = X;
f.Lexer = v;
f.lexer = v.lex;
f.Tokenizer = R;
f.Hooks = _;
f.parse = f;
f.options;
f.setOptions;
f.use;
f.walkTokens;
f.parseInline;
y.parse;
v.lex;
const Y = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-preview",
  "gpt-5.4-nano",
  "qwen3.5-397b-a17b"
], s = window.Vue.reactive({
  isOpen: !1,
  isMinimized: !1,
  isFullscreen: !1,
  activeTab: "chat",
  apiKey: "",
  isLoading: !1,
  isInitialized: !1,
  userPrompt: "",
  topics: [],
  currentTopicId: null,
  systemPrompts: [],
  selectedPromptId: "default",
  selectedModel: Y[0],
  router: null,
  vaultId: "",
  vaultUrl: "",
  showToast: null,
  confirm: null
}), x = {
  setContext(l) {
    s.router = l.router, s.vaultId = l.vaultId, s.vaultUrl = l.vaultUrl, s.showToast = l.showToast, s.confirm = l.confirm;
  },
  open() {
    s.isOpen = !0, s.isMinimized = !1;
  },
  close() {
    s.isOpen = !1, s.isMinimized = !1;
  },
  minimize() {
    s.isMinimized = !0, s.isOpen = !1;
  },
  toggle() {
    s.isOpen ? this.close() : this.open();
  },
  toggleFullscreen() {
    s.isFullscreen = !s.isFullscreen;
  },
  createNewTopic() {
    const l = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
      title: "Новый чат",
      history: [],
      updatedAt: Date.now()
    };
    s.topics.unshift(l), s.currentTopicId = l.id, s.activeTab = "chat";
  },
  selectTopic(l) {
    s.currentTopicId = l, s.activeTab = "chat";
  },
  deleteTopic(l) {
    s.topics = s.topics.filter((n) => n.id !== l), s.currentTopicId === l && (s.currentTopicId = s.topics.length > 0 ? s.topics[0].id : null);
  },
  clearCurrentTopic() {
    const l = this.getCurrentTopic();
    l && confirm("Очистить текущий чат?") && (l.history = [], l.updatedAt = Date.now());
  },
  getCurrentTopic() {
    return s.topics.find((l) => l.id === s.currentTopicId);
  },
  addPrompt(l, n) {
    const t = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
    s.systemPrompts.push({ id: t, name: l, content: n });
  },
  updatePrompt(l, n, t) {
    const e = s.systemPrompts.find((o) => o.id === l);
    e && (e.name = n, e.content = t);
  },
  deletePrompt(l) {
    l !== "default" && (s.systemPrompts = s.systemPrompts.filter((n) => n.id !== l), s.selectedPromptId === l && (s.selectedPromptId = "default"));
  }
};
function ve() {
  if (s.isInitialized)
    return;
  s.apiKey = localStorage.getItem("wm-ai-apikey") || "", s.selectedModel = localStorage.getItem("wm-ai-model") || Y[0];
  const l = localStorage.getItem("wm-ai-prompts");
  if (l) {
    const e = JSON.parse(l), o = /* @__PURE__ */ new Set();
    e.forEach((r) => {
      o.has(r.id) && (r.id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`), o.add(r.id);
    }), s.systemPrompts = e;
  } else {
    const e = localStorage.getItem("wm-ai-sysprompt");
    s.systemPrompts = [{
      id: "default",
      name: "Стандартный",
      content: e || "Ты полезный AI-ассистент. Отвечай кратко и по делу. Форматируй код и текст в Markdown."
    }];
  }
  s.selectedPromptId = localStorage.getItem("wm-ai-selected-prompt") || s.systemPrompts[0].id;
  const n = localStorage.getItem("wm-ai-topics");
  if (n)
    s.topics = JSON.parse(n);
  else {
    const e = localStorage.getItem("wm-ai-history");
    e && (s.topics = [{
      id: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`,
      title: "Старый чат",
      history: JSON.parse(e),
      updatedAt: Date.now()
    }]);
  }
  const t = localStorage.getItem("wm-ai-current-topic");
  t && s.topics.some((e) => e.id === t) ? s.currentTopicId = t : s.topics.length > 0 && (s.currentTopicId = s.topics[0].id), s.isInitialized = !0, window.Vue.watch(() => s.apiKey, (e) => localStorage.setItem("wm-ai-apikey", e)), window.Vue.watch(() => s.selectedModel, (e) => localStorage.setItem("wm-ai-model", e)), window.Vue.watch(() => s.selectedPromptId, (e) => localStorage.setItem("wm-ai-selected-prompt", e)), window.Vue.watch(() => s.systemPrompts, (e) => localStorage.setItem("wm-ai-prompts", JSON.stringify(e)), { deep: !0 }), window.Vue.watch(() => s.topics, (e) => localStorage.setItem("wm-ai-topics", JSON.stringify(e)), { deep: !0 }), window.Vue.watch(() => s.currentTopicId, (e) => {
    e && localStorage.setItem("wm-ai-current-topic", e);
  });
}
let B = null;
async function dt(l, n) {
  var i, a, c;
  if (!l.trim() || s.isLoading)
    return;
  if (!s.apiKey) {
    s.activeTab = "settings", alert('Пожалуйста, укажите API ключ на вкладке "Настройки".');
    return;
  }
  s.currentTopicId || x.createNewTopic();
  const t = x.getCurrentTopic();
  if (!t)
    return;
  (t.title === "Новый чат" || t.title === "Старый чат") && (t.title = l.length > 30 ? `${l.slice(0, 30)}...` : l);
  const o = [
    { role: "system", content: (s.systemPrompts.find((u) => u.id === s.selectedPromptId) || s.systemPrompts[0]).content }
  ];
  for (const u of t.history)
    u.status === "success" && (o.push({ role: "user", content: u.prompt }), u.response && o.push({ role: "assistant", content: u.response }));
  o.push({ role: "user", content: l });
  const r = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  t.history.push({
    id: r,
    prompt: l,
    response: "",
    status: "loading",
    date: Date.now()
  }), t.updatedAt = Date.now(), s.isLoading = !0, B = new AbortController(), n();
  try {
    const u = await fetch("https://api.aihubmix.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${s.apiKey}`
      },
      body: JSON.stringify({
        model: s.selectedModel,
        messages: o
        // Отправляем собранный массив с контекстом
      }),
      signal: B.signal
    });
    if (!u.ok)
      throw new Error(`Ошибка API: ${u.status}`);
    const h = ((c = (a = (i = (await u.json()).choices) == null ? void 0 : i[0]) == null ? void 0 : a.message) == null ? void 0 : c.content) || "Пустой ответ";
    O(r, { response: h, status: "success" });
  } catch (u) {
    u.name === "AbortError" ? O(r, { response: "Запрос отменен.", status: "aborted" }) : O(r, { response: `Ошибка: ${u.message}`, status: "error" });
  } finally {
    s.isLoading = !1, B = null, t.updatedAt = Date.now(), n();
  }
}
function O(l, n) {
  const t = x.getCurrentTopic();
  if (!t)
    return;
  const e = t.history.findIndex((o) => o.id === l);
  e !== -1 && (t.history[e] = { ...t.history[e], ...n });
}
function de() {
  B && B.abort();
}
const ut = {
  key: 0,
  style: { "text-align": "center", color: "var(--fg-muted-color)", "margin-top": "40px" }
}, pt = { class: "ai-prompt-bubble" }, wt = {
  key: 0,
  class: "ai-status loading"
}, ht = ["innerHTML"], gt = { class: "ai-input-area" }, ft = { class: "ai-input-box" }, mt = ["onKeydown"], bt = { class: "ai-input-bottom" }, xt = { class: "ai-tools-left" }, kt = { class: "ai-dropdown-wrap" }, Vt = { class: "tool-text" }, vt = {
  key: 0,
  class: "ai-dropdown"
}, yt = ["onClick"], Et = { class: "ai-dropdown-wrap" }, $t = { class: "tool-text" }, Nt = {
  key: 0,
  class: "ai-dropdown"
}, Tt = ["onClick"], zt = { class: "ai-tools-right" }, ye = /* @__PURE__ */ window.Vue.defineComponent({
  __name: "ai-chat",
  setup(l) {
    const n = window.Vue.ref(null), t = window.Vue.ref(!1), e = window.Vue.ref(!1), o = window.Vue.computed(() => x.getCurrentTopic()), r = window.Vue.computed(() => {
      var p;
      return ((p = s.systemPrompts.find((w) => w.id === s.selectedPromptId)) == null ? void 0 : p.name) || "Неизвестно";
    });
    function i() {
      window.Vue.nextTick(() => {
        n.value && (n.value.scrollTop = n.value.scrollHeight);
      });
    }
    window.Vue.watch(() => s.isOpen, (p) => {
      p && s.activeTab === "chat" && i();
    }), window.Vue.watch(() => s.currentTopicId, () => i());
    function a(p) {
      try {
        return f.parse(p);
      } catch {
        return p;
      }
    }
    function c() {
      const p = s.userPrompt.trim();
      p && (s.userPrompt = "", dt(p, i));
    }
    function u(p) {
      s.selectedModel = p, e.value = !1;
    }
    function d(p) {
      s.selectedPromptId = p, t.value = !1;
    }
    function h() {
      t.value = !1, e.value = !1;
    }
    return (p, w) => (window.Vue.openBlock(), window.Vue.createElementBlock("div", {
      class: "ai-tab-view",
      onClick: h
    }, [
      window.Vue.createElementVNode("div", {
        ref_key: "chatBodyRef",
        ref: n,
        class: "ai-body"
      }, [
        !o.value || o.value.history.length === 0 ? (window.Vue.openBlock(), window.Vue.createElementBlock("div", ut, " Новый диалог начат. Напишите первый запрос! ")) : window.Vue.createCommentVNode("", !0),
        o.value ? (window.Vue.openBlock(!0), window.Vue.createElementBlock(window.Vue.Fragment, { key: 1 }, window.Vue.renderList(o.value.history, (g) => (window.Vue.openBlock(), window.Vue.createElementBlock("div", {
          key: g.id,
          class: "ai-history-item"
        }, [
          window.Vue.createElementVNode("div", pt, window.Vue.toDisplayString(g.prompt), 1),
          g.status === "loading" ? (window.Vue.openBlock(), window.Vue.createElementBlock("div", wt, " Генерация ответа... ")) : (window.Vue.openBlock(), window.Vue.createElementBlock("div", {
            key: 1,
            class: "ai-response-bubble ai-md-content markdown-body",
            innerHTML: a(g.response)
          }, null, 8, ht)),
          window.Vue.createElementVNode("div", {
            class: window.Vue.normalizeClass(["ai-status", g.status])
          }, window.Vue.toDisplayString(g.status === "error" ? "Ошибка" : g.status === "aborted" ? "Отменено" : new Date(g.date).toLocaleTimeString()), 3)
        ]))), 128)) : window.Vue.createCommentVNode("", !0)
      ], 512),
      window.Vue.createElementVNode("div", gt, [
        window.Vue.createElementVNode("div", ft, [
          window.Vue.withDirectives(window.Vue.createElementVNode("textarea", {
            "onUpdate:modelValue": w[0] || (w[0] = (g) => window.Vue.unref(s).userPrompt = g),
            class: "ai-textarea custom-scrollbar",
            placeholder: "Напишите сообщение...",
            onKeydown: window.Vue.withKeys(window.Vue.withModifiers(c, ["ctrl", "prevent"]), ["enter"])
          }, null, 40, mt), [
            [window.Vue.vModelText, window.Vue.unref(s).userPrompt]
          ]),
          window.Vue.createElementVNode("div", bt, [
            window.Vue.createElementVNode("div", xt, [
              window.Vue.createElementVNode("button", {
                class: "ai-tool-btn shrink-none",
                title: "Очистить чат",
                onClick: w[1] || (w[1] = window.Vue.withModifiers((g) => window.Vue.unref(x).clearCurrentTopic(), ["stop"]))
              }, [...w[6] || (w[6] = [
                window.Vue.createElementVNode("svg", {
                  xmlns: "http://www.w3.org/2000/svg",
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2"
                }, [
                  window.Vue.createElementVNode("polyline", { points: "3 6 5 6 21 6" }),
                  window.Vue.createElementVNode("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
                ], -1)
              ])]),
              window.Vue.createElementVNode("button", {
                class: "ai-tool-btn shrink-none",
                title: "Новый топик",
                onClick: w[2] || (w[2] = window.Vue.withModifiers((g) => window.Vue.unref(x).createNewTopic(), ["stop"]))
              }, [...w[7] || (w[7] = [
                window.Vue.createElementVNode("svg", {
                  xmlns: "http://www.w3.org/2000/svg",
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2"
                }, [
                  window.Vue.createElementVNode("rect", {
                    x: "3",
                    y: "3",
                    width: "18",
                    height: "18",
                    rx: "2",
                    ry: "2"
                  }),
                  window.Vue.createElementVNode("line", {
                    x1: "12",
                    y1: "8",
                    x2: "12",
                    y2: "16"
                  }),
                  window.Vue.createElementVNode("line", {
                    x1: "8",
                    y1: "12",
                    x2: "16",
                    y2: "12"
                  })
                ], -1)
              ])]),
              window.Vue.createElementVNode("div", kt, [
                window.Vue.createElementVNode("button", {
                  class: "ai-tool-btn",
                  title: "Выбор промпта",
                  onClick: w[3] || (w[3] = window.Vue.withModifiers((g) => {
                    t.value = !t.value, e.value = !1;
                  }, ["stop"]))
                }, [
                  w[8] || (w[8] = window.Vue.createElementVNode("svg", {
                    xmlns: "http://www.w3.org/2000/svg",
                    width: "16",
                    height: "16",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    "stroke-width": "2",
                    class: "shrink-none"
                  }, [
                    window.Vue.createElementVNode("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
                  ], -1)),
                  window.Vue.createElementVNode("span", Vt, window.Vue.toDisplayString(r.value), 1)
                ]),
                t.value ? (window.Vue.openBlock(), window.Vue.createElementBlock("div", vt, [
                  w[9] || (w[9] = window.Vue.createElementVNode("div", { class: "dropdown-title" }, " Промпт ", -1)),
                  (window.Vue.openBlock(!0), window.Vue.createElementBlock(window.Vue.Fragment, null, window.Vue.renderList(window.Vue.unref(s).systemPrompts, (g) => (window.Vue.openBlock(), window.Vue.createElementBlock("div", {
                    key: g.id,
                    class: window.Vue.normalizeClass(["dropdown-item", { "is-active": g.id === window.Vue.unref(s).selectedPromptId }]),
                    onClick: window.Vue.withModifiers((k) => d(g.id), ["stop"])
                  }, window.Vue.toDisplayString(g.name), 11, yt))), 128))
                ])) : window.Vue.createCommentVNode("", !0)
              ]),
              window.Vue.createElementVNode("div", Et, [
                window.Vue.createElementVNode("button", {
                  class: "ai-tool-btn",
                  title: "Выбор модели",
                  onClick: w[4] || (w[4] = window.Vue.withModifiers((g) => {
                    e.value = !e.value, t.value = !1;
                  }, ["stop"]))
                }, [
                  w[10] || (w[10] = window.Vue.createStaticVNode('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-none"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>', 1)),
                  window.Vue.createElementVNode("span", $t, window.Vue.toDisplayString(window.Vue.unref(s).selectedModel), 1)
                ]),
                e.value ? (window.Vue.openBlock(), window.Vue.createElementBlock("div", Nt, [
                  w[11] || (w[11] = window.Vue.createElementVNode("div", { class: "dropdown-title" }, " Модель ", -1)),
                  (window.Vue.openBlock(!0), window.Vue.createElementBlock(window.Vue.Fragment, null, window.Vue.renderList(window.Vue.unref(Y), (g) => (window.Vue.openBlock(), window.Vue.createElementBlock("div", {
                    key: g,
                    class: window.Vue.normalizeClass(["dropdown-item", { "is-active": g === window.Vue.unref(s).selectedModel }]),
                    onClick: window.Vue.withModifiers((k) => u(g), ["stop"])
                  }, window.Vue.toDisplayString(g), 11, Tt))), 128))
                ])) : window.Vue.createCommentVNode("", !0)
              ])
            ]),
            window.Vue.createElementVNode("div", zt, [
              window.Vue.unref(s).isLoading ? (window.Vue.openBlock(), window.Vue.createElementBlock("button", {
                key: 0,
                class: "ai-send-btn is-stop",
                title: "Отменить",
                onClick: w[5] || (w[5] = window.Vue.withModifiers(
                  //@ts-ignore
                  (...g) => window.Vue.unref(de) && window.Vue.unref(de)(...g),
                  ["stop"]
                ))
              }, [...w[12] || (w[12] = [
                window.Vue.createElementVNode("svg", {
                  xmlns: "http://www.w3.org/2000/svg",
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "currentColor"
                }, [
                  window.Vue.createElementVNode("rect", {
                    x: "6",
                    y: "6",
                    width: "12",
                    height: "12",
                    rx: "2"
                  })
                ], -1)
              ])])) : (window.Vue.openBlock(), window.Vue.createElementBlock("button", {
                key: 1,
                class: window.Vue.normalizeClass(["ai-send-btn", { "is-ready": window.Vue.unref(s).userPrompt.trim() }]),
                title: "Отправить",
                onClick: window.Vue.withModifiers(c, ["stop"])
              }, [...w[13] || (w[13] = [
                window.Vue.createElementVNode("svg", {
                  xmlns: "http://www.w3.org/2000/svg",
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                }, [
                  window.Vue.createElementVNode("line", {
                    x1: "22",
                    y1: "2",
                    x2: "11",
                    y2: "13"
                  }),
                  window.Vue.createElementVNode("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
                ], -1)
              ])], 2))
            ])
          ])
        ])
      ])
    ]));
  }
}), Ct = { class: "ai-tab-view" }, _t = { class: "ai-body custom-scrollbar" }, Bt = { class: "ai-settings" }, It = { class: "settings-block" }, St = { class: "topics-header" }, Mt = ["disabled"], At = { class: "settings-block" }, Pt = {
  key: 0,
  class: "prompt-editor"
}, Rt = { class: "editor-actions" }, Lt = { class: "prompts-list" }, Dt = { class: "prompt-info" }, jt = { class: "prompt-name" }, qt = { class: "prompt-preview" }, Ht = { class: "prompt-actions" }, Ot = ["onClick"], Zt = ["onClick"], Ee = /* @__PURE__ */ window.Vue.defineComponent({
  __name: "ai-settings",
  setup(l) {
    const n = window.Vue.ref(null), t = window.Vue.ref(""), e = window.Vue.ref(""), o = window.Vue.ref(!1);
    function r() {
      n.value = "new", t.value = "Новый промпт", e.value = "";
    }
    function i(u) {
      n.value = u.id, t.value = u.name, e.value = u.content;
    }
    function a() {
      !t.value.trim() || !e.value.trim() || (n.value === "new" ? x.addPrompt(t.value, e.value) : n.value && x.updatePrompt(n.value, t.value, e.value), n.value = null);
    }
    async function c() {
      o.value = !0;
      try {
        const u = `${s.vaultUrl}/plugins/configs/ai-assistant.json`, d = await fetch(u);
        if (!d.ok)
          throw new Error(`Ошибка HTTP: ${d.status}`);
        const h = await d.json();
        let p = !1;
        h.apiKey && (s.apiKey = h.apiKey, p = !0), h.prompts && Array.isArray(h.prompts) && (h.prompts.forEach((w) => {
          s.systemPrompts.some((g) => g.name === w.name) || x.addPrompt(w.name || "Без названия", w.content || "");
        }), p = !0), p ? s.showToast ? s.showToast("Конфиг успешно загружен!", { type: "success" }) : alert("Конфиг успешно загружен!") : s.showToast ? s.showToast("Конфиг пуст или имеет неверный формат", { type: "warning" }) : alert("Конфиг пуст или имеет неверный формат");
      } catch (u) {
        s.showToast ? s.showToast(`Не удалось загрузить конфиг: ${u.message}`, { type: "error" }) : alert(`Не удалось загрузить конфиг: ${u.message}`);
      } finally {
        o.value = !1;
      }
    }
    return (u, d) => (window.Vue.openBlock(), window.Vue.createElementBlock("div", Ct, [
      window.Vue.createElementVNode("div", _t, [
        window.Vue.createElementVNode("div", Bt, [
          window.Vue.createElementVNode("div", It, [
            window.Vue.createElementVNode("div", St, [
              d[4] || (d[4] = window.Vue.createElementVNode("label", { style: { margin: "0" } }, "API Key (AiHubMix)", -1)),
              window.Vue.createElementVNode("button", {
                class: "ai-btn ai-btn-sm",
                disabled: o.value,
                onClick: c
              }, window.Vue.toDisplayString(o.value ? "Загрузка..." : "Загрузить конфиг"), 9, Mt)
            ]),
            window.Vue.withDirectives(window.Vue.createElementVNode("input", {
              "onUpdate:modelValue": d[0] || (d[0] = (h) => window.Vue.unref(s).apiKey = h),
              type: "password",
              placeholder: "sk-...",
              class: "editor-input"
            }, null, 512), [
              [window.Vue.vModelText, window.Vue.unref(s).apiKey]
            ])
          ]),
          window.Vue.createElementVNode("div", At, [
            window.Vue.createElementVNode("div", { class: "topics-header" }, [
              d[5] || (d[5] = window.Vue.createElementVNode("label", { style: { margin: "0" } }, "Ваши системные промпты", -1)),
              window.Vue.createElementVNode("button", {
                class: "ai-btn ai-btn-primary ai-btn-sm",
                onClick: r
              }, " + Добавить ")
            ]),
            n.value ? (window.Vue.openBlock(), window.Vue.createElementBlock("div", Pt, [
              window.Vue.withDirectives(window.Vue.createElementVNode("input", {
                "onUpdate:modelValue": d[1] || (d[1] = (h) => t.value = h),
                placeholder: "Название промпта",
                class: "editor-input"
              }, null, 512), [
                [window.Vue.vModelText, t.value]
              ]),
              window.Vue.withDirectives(window.Vue.createElementVNode("textarea", {
                "onUpdate:modelValue": d[2] || (d[2] = (h) => e.value = h),
                rows: "4",
                placeholder: "Ты профессиональный переводчик...",
                class: "editor-input custom-scrollbar"
              }, null, 512), [
                [window.Vue.vModelText, e.value]
              ]),
              window.Vue.createElementVNode("div", Rt, [
                window.Vue.createElementVNode("button", {
                  class: "ai-btn ai-btn-sm",
                  onClick: d[3] || (d[3] = (h) => n.value = null)
                }, " Отмена "),
                window.Vue.createElementVNode("button", {
                  class: "ai-btn ai-btn-primary ai-btn-sm",
                  onClick: a
                }, " Сохранить ")
              ])
            ])) : window.Vue.createCommentVNode("", !0),
            window.Vue.createElementVNode("div", Lt, [
              (window.Vue.openBlock(!0), window.Vue.createElementBlock(window.Vue.Fragment, null, window.Vue.renderList(window.Vue.unref(s).systemPrompts, (h) => (window.Vue.openBlock(), window.Vue.createElementBlock("div", {
                key: h.id,
                class: "prompt-card"
              }, [
                window.Vue.createElementVNode("div", Dt, [
                  window.Vue.createElementVNode("div", jt, window.Vue.toDisplayString(h.name), 1),
                  window.Vue.createElementVNode("div", qt, window.Vue.toDisplayString(h.content), 1)
                ]),
                window.Vue.createElementVNode("div", Ht, [
                  window.Vue.createElementVNode("button", {
                    class: "ai-icon-btn",
                    onClick: (p) => i(h)
                  }, [...d[6] || (d[6] = [
                    window.Vue.createElementVNode("svg", {
                      xmlns: "http://www.w3.org/2000/svg",
                      width: "16",
                      height: "16",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      "stroke-width": "2"
                    }, [
                      window.Vue.createElementVNode("path", { d: "M12 20h9" }),
                      window.Vue.createElementVNode("path", { d: "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" })
                    ], -1)
                  ])], 8, Ot),
                  h.id !== "default" ? (window.Vue.openBlock(), window.Vue.createElementBlock("button", {
                    key: 0,
                    class: "ai-icon-btn danger",
                    onClick: (p) => window.Vue.unref(x).deletePrompt(h.id)
                  }, [...d[7] || (d[7] = [
                    window.Vue.createElementVNode("svg", {
                      xmlns: "http://www.w3.org/2000/svg",
                      width: "16",
                      height: "16",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      "stroke-width": "2"
                    }, [
                      window.Vue.createElementVNode("line", {
                        x1: "18",
                        y1: "6",
                        x2: "6",
                        y2: "18"
                      }),
                      window.Vue.createElementVNode("line", {
                        x1: "6",
                        y1: "6",
                        x2: "18",
                        y2: "18"
                      })
                    ], -1)
                  ])], 8, Zt)) : window.Vue.createCommentVNode("", !0)
                ])
              ]))), 128))
            ])
          ])
        ])
      ])
    ]));
  }
}), Ft = { class: "ai-tab-view" }, Qt = { class: "ai-body custom-scrollbar" }, Kt = { class: "ai-topics" }, Ut = { class: "topics-header" }, Jt = {
  key: 0,
  class: "topics-empty"
}, Gt = { class: "topics-list" }, Wt = ["onClick"], Xt = { class: "topic-info" }, Yt = { class: "topic-title" }, en = { class: "topic-meta" }, tn = ["onClick"], $e = /* @__PURE__ */ window.Vue.defineComponent({
  __name: "ai-topics",
  setup(l) {
    function n(t) {
      return new Date(t).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return (t, e) => (window.Vue.openBlock(), window.Vue.createElementBlock("div", Ft, [
      window.Vue.createElementVNode("div", Qt, [
        window.Vue.createElementVNode("div", Kt, [
          window.Vue.createElementVNode("div", Ut, [
            e[1] || (e[1] = window.Vue.createElementVNode("h3", null, "Ваши диалоги", -1)),
            window.Vue.createElementVNode("button", {
              class: "ai-btn ai-btn-primary ai-btn-sm",
              onClick: e[0] || (e[0] = (o) => window.Vue.unref(x).createNewTopic())
            }, " + Новый чат ")
          ]),
          window.Vue.unref(s).topics.length === 0 ? (window.Vue.openBlock(), window.Vue.createElementBlock("div", Jt, " У вас еще нет сохраненных чатов. ")) : window.Vue.createCommentVNode("", !0),
          window.Vue.createElementVNode("div", Gt, [
            (window.Vue.openBlock(!0), window.Vue.createElementBlock(window.Vue.Fragment, null, window.Vue.renderList(window.Vue.unref(s).topics, (o) => (window.Vue.openBlock(), window.Vue.createElementBlock("div", {
              key: o.id,
              class: window.Vue.normalizeClass(["topic-card", { "is-active": o.id === window.Vue.unref(s).currentTopicId }]),
              onClick: (r) => window.Vue.unref(x).selectTopic(o.id)
            }, [
              window.Vue.createElementVNode("div", Xt, [
                window.Vue.createElementVNode("div", Yt, window.Vue.toDisplayString(o.title), 1),
                window.Vue.createElementVNode("div", en, [
                  window.Vue.createElementVNode("span", null, window.Vue.toDisplayString(o.history.length) + " сообщений", 1),
                  e[2] || (e[2] = window.Vue.createElementVNode("span", null, "•", -1)),
                  window.Vue.createElementVNode("span", null, window.Vue.toDisplayString(n(o.updatedAt)), 1)
                ])
              ]),
              window.Vue.createElementVNode("button", {
                class: "topic-delete-btn",
                title: "Удалить",
                onClick: window.Vue.withModifiers((r) => window.Vue.unref(x).deleteTopic(o.id), ["stop"])
              }, [...e[3] || (e[3] = [
                window.Vue.createElementVNode("svg", {
                  xmlns: "http://www.w3.org/2000/svg",
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2"
                }, [
                  window.Vue.createElementVNode("polyline", { points: "3 6 5 6 21 6" }),
                  window.Vue.createElementVNode("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
                ], -1)
              ])], 8, tn)
            ], 10, Wt))), 128))
          ])
        ])
      ])
    ]));
  }
}), nn = {
  key: 0,
  class: "ai-indicator"
}, on = {
  key: 0,
  class: "ai-indicator",
  style: { position: "static" }
}, rn = {
  key: 1,
  xmlns: "http://www.w3.org/2000/svg",
  width: "18",
  height: "18",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2"
}, sn = { class: "ai-header" }, ln = { class: "ai-header-actions" }, an = ["title"], cn = {
  key: 0,
  xmlns: "http://www.w3.org/2000/svg",
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}, dn = {
  key: 1,
  xmlns: "http://www.w3.org/2000/svg",
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}, un = { class: "ai-tabs" }, pn = { class: "ai-tabs-content" }, wn = /* @__PURE__ */ window.Vue.defineComponent({
  name: "AiAssistantWidget",
  inheritAttrs: !1,
  __name: "ai-assistant",
  setup(l) {
    window.Vue.onMounted(() => ve());
    function n() {
      x.close(), s.router && s.vaultId && s.router.push(`/${s.vaultId}/plugin/ai-assistant`);
    }
    return (t, e) => (window.Vue.openBlock(), window.Vue.createElementBlock(window.Vue.Fragment, null, [
      window.Vue.createElementVNode("button", window.Vue.mergeProps(t.$attrs, {
        type: "button",
        class: "ai-trigger",
        title: "AI Assistant",
        onClick: e[0] || (e[0] = window.Vue.withModifiers((o) => window.Vue.unref(x).toggle(), ["stop", "prevent"]))
      }), [
        e[9] || (e[9] = window.Vue.createStaticVNode('<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"></path><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>', 1)),
        window.Vue.unref(s).isLoading && !window.Vue.unref(s).isOpen ? (window.Vue.openBlock(), window.Vue.createElementBlock("div", nn)) : window.Vue.createCommentVNode("", !0)
      ], 16),
      (window.Vue.openBlock(), window.Vue.createBlock(window.Vue.Teleport, { to: "body" }, [
        window.Vue.unref(s).isMinimized ? (window.Vue.openBlock(), window.Vue.createElementBlock("div", {
          key: 0,
          class: "ai-minimized-widget",
          onClick: e[1] || (e[1] = window.Vue.withModifiers((o) => window.Vue.unref(x).open(), ["stop"]))
        }, [
          window.Vue.unref(s).isLoading ? (window.Vue.openBlock(), window.Vue.createElementBlock("div", on)) : (window.Vue.openBlock(), window.Vue.createElementBlock("svg", rn, [...e[10] || (e[10] = [
            window.Vue.createElementVNode("path", { d: "M12 8V4H8" }, null, -1),
            window.Vue.createElementVNode("rect", {
              x: "4",
              y: "8",
              width: "16",
              height: "12",
              rx: "2"
            }, null, -1)
          ])])),
          window.Vue.createElementVNode("span", null, window.Vue.toDisplayString(window.Vue.unref(s).isLoading ? "AI думает..." : "AI Assistant"), 1)
        ])) : window.Vue.createCommentVNode("", !0),
        window.Vue.createVNode(window.Vue.Transition, { name: "ai-fade" }, {
          default: window.Vue.withCtx(() => [
            window.Vue.unref(s).isOpen ? (window.Vue.openBlock(), window.Vue.createElementBlock("div", {
              key: 0,
              class: "ai-backdrop",
              onMousedown: e[8] || (e[8] = window.Vue.withModifiers((o) => window.Vue.unref(x).close(), ["self"]))
            }, [
              window.Vue.createElementVNode("div", {
                class: window.Vue.normalizeClass(["ai-modal", { "is-fullscreen": window.Vue.unref(s).isFullscreen }])
              }, [
                window.Vue.createElementVNode("div", sn, [
                  e[16] || (e[16] = window.Vue.createElementVNode("div", { class: "ai-title" }, [
                    window.Vue.createElementVNode("svg", {
                      xmlns: "http://www.w3.org/2000/svg",
                      width: "20",
                      height: "20",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      "stroke-width": "2"
                    }, [
                      window.Vue.createElementVNode("path", { d: "M12 8V4H8" }),
                      window.Vue.createElementVNode("rect", {
                        x: "4",
                        y: "8",
                        width: "16",
                        height: "12",
                        rx: "2"
                      })
                    ]),
                    window.Vue.createTextVNode(" AI Assistant ")
                  ], -1)),
                  window.Vue.createElementVNode("div", ln, [
                    window.Vue.createElementVNode("button", {
                      class: "ai-icon-btn",
                      title: "Открыть на отдельной странице",
                      type: "button",
                      onClick: window.Vue.withModifiers(n, ["stop"])
                    }, [...e[11] || (e[11] = [
                      window.Vue.createElementVNode("svg", {
                        xmlns: "http://www.w3.org/2000/svg",
                        width: "16",
                        height: "16",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        "stroke-width": "2",
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round"
                      }, [
                        window.Vue.createElementVNode("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }),
                        window.Vue.createElementVNode("polyline", { points: "15 3 21 3 21 9" }),
                        window.Vue.createElementVNode("line", {
                          x1: "10",
                          y1: "14",
                          x2: "21",
                          y2: "3"
                        })
                      ], -1)
                    ])]),
                    window.Vue.createElementVNode("button", {
                      class: "ai-icon-btn",
                      title: window.Vue.unref(s).isFullscreen ? "Оконный режим" : "На весь экран",
                      type: "button",
                      onClick: e[2] || (e[2] = window.Vue.withModifiers((o) => window.Vue.unref(x).toggleFullscreen(), ["stop"]))
                    }, [
                      window.Vue.unref(s).isFullscreen ? (window.Vue.openBlock(), window.Vue.createElementBlock("svg", dn, [...e[13] || (e[13] = [
                        window.Vue.createElementVNode("path", { d: "M8 3v3a2 2 0 0 1-2 2H3" }, null, -1),
                        window.Vue.createElementVNode("path", { d: "M16 3v3a2 2 0 0 0 2 2h3" }, null, -1),
                        window.Vue.createElementVNode("path", { d: "M8 21v-3a2 2 0 0 0-2-2H3" }, null, -1),
                        window.Vue.createElementVNode("path", { d: "M16 21v-3a2 2 0 0 1 2-2h3" }, null, -1)
                      ])])) : (window.Vue.openBlock(), window.Vue.createElementBlock("svg", cn, [...e[12] || (e[12] = [
                        window.Vue.createElementVNode("path", { d: "M8 3H5a2 2 0 0 0-2 2v3" }, null, -1),
                        window.Vue.createElementVNode("path", { d: "M16 3h3a2 2 0 0 1 2 2v3" }, null, -1),
                        window.Vue.createElementVNode("path", { d: "M8 21H5a2 2 0 0 1-2-2v-3" }, null, -1),
                        window.Vue.createElementVNode("path", { d: "M16 21h3a2 2 0 0 0 2-2v-3" }, null, -1)
                      ])]))
                    ], 8, an),
                    window.Vue.createElementVNode("button", {
                      class: "ai-icon-btn",
                      title: "Свернуть в фон",
                      type: "button",
                      onClick: e[3] || (e[3] = window.Vue.withModifiers((o) => window.Vue.unref(x).minimize(), ["stop"]))
                    }, [...e[14] || (e[14] = [
                      window.Vue.createElementVNode("svg", {
                        xmlns: "http://www.w3.org/2000/svg",
                        width: "18",
                        height: "18",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        "stroke-width": "2"
                      }, [
                        window.Vue.createElementVNode("polyline", { points: "4 14 10 14 10 20" }),
                        window.Vue.createElementVNode("polyline", { points: "20 10 14 10 14 4" }),
                        window.Vue.createElementVNode("line", {
                          x1: "14",
                          y1: "10",
                          x2: "21",
                          y2: "3"
                        }),
                        window.Vue.createElementVNode("line", {
                          x1: "3",
                          y1: "21",
                          x2: "10",
                          y2: "14"
                        })
                      ], -1)
                    ])]),
                    window.Vue.createElementVNode("button", {
                      class: "ai-icon-btn",
                      title: "Закрыть",
                      type: "button",
                      onClick: e[4] || (e[4] = window.Vue.withModifiers((o) => window.Vue.unref(x).close(), ["stop"]))
                    }, [...e[15] || (e[15] = [
                      window.Vue.createElementVNode("svg", {
                        xmlns: "http://www.w3.org/2000/svg",
                        width: "18",
                        height: "18",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        "stroke-width": "2"
                      }, [
                        window.Vue.createElementVNode("line", {
                          x1: "18",
                          y1: "6",
                          x2: "6",
                          y2: "18"
                        }),
                        window.Vue.createElementVNode("line", {
                          x1: "6",
                          y1: "6",
                          x2: "18",
                          y2: "18"
                        })
                      ], -1)
                    ])])
                  ])
                ]),
                window.Vue.createElementVNode("div", un, [
                  window.Vue.createElementVNode("button", {
                    class: window.Vue.normalizeClass(["ai-tab", { "is-active": window.Vue.unref(s).activeTab === "chat" }]),
                    onClick: e[5] || (e[5] = (o) => window.Vue.unref(s).activeTab = "chat")
                  }, " Чат ", 2),
                  window.Vue.createElementVNode("button", {
                    class: window.Vue.normalizeClass(["ai-tab", { "is-active": window.Vue.unref(s).activeTab === "topics" }]),
                    onClick: e[6] || (e[6] = (o) => window.Vue.unref(s).activeTab = "topics")
                  }, " Топики ", 2),
                  window.Vue.createElementVNode("button", {
                    class: window.Vue.normalizeClass(["ai-tab", { "is-active": window.Vue.unref(s).activeTab === "settings" }]),
                    onClick: e[7] || (e[7] = (o) => window.Vue.unref(s).activeTab = "settings")
                  }, " Настройки ", 2)
                ]),
                window.Vue.createElementVNode("div", pn, [
                  window.Vue.withDirectives(window.Vue.createVNode(ye, null, null, 512), [
                    [window.Vue.vShow, window.Vue.unref(s).activeTab === "chat"]
                  ]),
                  window.Vue.unref(s).activeTab === "topics" ? (window.Vue.openBlock(), window.Vue.createBlock($e, { key: 0 })) : window.Vue.createCommentVNode("", !0),
                  window.Vue.unref(s).activeTab === "settings" ? (window.Vue.openBlock(), window.Vue.createBlock(Ee, { key: 1 })) : window.Vue.createCommentVNode("", !0)
                ])
              ], 2)
            ], 32)) : window.Vue.createCommentVNode("", !0)
          ]),
          _: 1
        })
      ]))
    ], 64));
  }
}), hn = { class: "ai-page" }, gn = { class: "ai-page-header" }, fn = { class: "ai-page-header-actions" }, mn = { class: "ai-page-chat-wrapper" }, bn = /* @__PURE__ */ window.Vue.defineComponent({
  __name: "ai-page",
  setup(l) {
    return window.Vue.onMounted(() => {
      ve(), s.activeTab || (s.activeTab = "chat");
    }), (n, t) => (window.Vue.openBlock(), window.Vue.createElementBlock("div", hn, [
      window.Vue.createElementVNode("div", gn, [
        t[6] || (t[6] = window.Vue.createElementVNode("h2", null, "AI Assistant", -1)),
        window.Vue.createElementVNode("div", fn, [
          window.Vue.createElementVNode("button", {
            class: window.Vue.normalizeClass(["ai-page-btn", { "is-active": window.Vue.unref(s).activeTab === "chat" }]),
            title: "Чат",
            onClick: t[0] || (t[0] = (e) => window.Vue.unref(s).activeTab = "chat")
          }, [...t[3] || (t[3] = [
            window.Vue.createElementVNode("svg", {
              xmlns: "http://www.w3.org/2000/svg",
              width: "16",
              height: "16",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": "2"
            }, [
              window.Vue.createElementVNode("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
            ], -1),
            window.Vue.createElementVNode("span", { class: "btn-text" }, "Чат", -1)
          ])], 2),
          window.Vue.createElementVNode("button", {
            class: window.Vue.normalizeClass(["ai-page-btn", { "is-active": window.Vue.unref(s).activeTab === "topics" }]),
            title: "Топики",
            onClick: t[1] || (t[1] = (e) => window.Vue.unref(s).activeTab = "topics")
          }, [...t[4] || (t[4] = [
            window.Vue.createStaticVNode('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg><span class="btn-text">Топики</span>', 2)
          ])], 2),
          window.Vue.createElementVNode("button", {
            class: window.Vue.normalizeClass(["ai-page-btn", { "is-active": window.Vue.unref(s).activeTab === "settings" }]),
            title: "Настройки",
            onClick: t[2] || (t[2] = (e) => window.Vue.unref(s).activeTab = "settings")
          }, [...t[5] || (t[5] = [
            window.Vue.createElementVNode("svg", {
              xmlns: "http://www.w3.org/2000/svg",
              width: "16",
              height: "16",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": "2"
            }, [
              window.Vue.createElementVNode("circle", {
                cx: "12",
                cy: "12",
                r: "3"
              }),
              window.Vue.createElementVNode("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" })
            ], -1),
            window.Vue.createElementVNode("span", { class: "btn-text" }, "Настройки", -1)
          ])], 2)
        ])
      ]),
      window.Vue.createElementVNode("div", mn, [
        window.Vue.withDirectives(window.Vue.createVNode(ye, null, null, 512), [
          [window.Vue.vShow, window.Vue.unref(s).activeTab === "chat"]
        ]),
        window.Vue.unref(s).activeTab === "topics" ? (window.Vue.openBlock(), window.Vue.createBlock($e, { key: 0 })) : window.Vue.createCommentVNode("", !0),
        window.Vue.unref(s).activeTab === "settings" ? (window.Vue.openBlock(), window.Vue.createBlock(Ee, { key: 1 })) : window.Vue.createCommentVNode("", !0)
      ])
    ]));
  }
}), xn = `/* === БАЗОВЫЕ КОНТЕЙНЕРЫ === */
.ai-trigger { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid var(--border-secondary-color); border-radius: 8px; background: transparent; color: var(--fg-secondary-color); cursor: pointer; transition: all 0.2s ease; position: relative; }
.ai-trigger:hover { background: var(--bg-hover-color); color: var(--fg-accent-color); border-color: var(--border-accent-color); }
.ai-indicator { position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background-color: var(--fg-accent-color); border-radius: 50%; border: 2px solid var(--bg-primary-color); animation: ai-pulse 2s infinite cubic-bezier(0.4, 0, 0.2, 1); }

@keyframes ai-pulse { 
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 var(--bg-accent-overlay-color); } 
  70% { transform: scale(1); box-shadow: 0 0 0 6px transparent; } 
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 transparent; } 
}

.ai-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(3px); z-index: 99999; display: flex; justify-content: center; align-items: center; padding: 8px; }
.ai-modal { width: 100%; max-width: 680px; height: 85vh; max-height: 800px; background: var(--bg-primary-color); border: 1px solid var(--border-secondary-color); border-radius: 16px; box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.3); display: flex; flex-direction: column; overflow: hidden; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.ai-modal.is-fullscreen { 
    position: fixed !important; 
    top: 0 !important; 
    left: 0 !important; 
    right: 0 !important; 
    bottom: 0 !important; 
    width: 100vw !important; 
    
    height: 100vh !important;
    height: 100dvh !important; 
    
    max-width: none !important; 
    max-height: none !important; 
    border-radius: 0 !important; 
    margin: 0 !important; 
    transform: none !important; 
}

.ai-modal.is-fullscreen .ai-input-area {
    padding: 0;
}
.ai-modal.is-fullscreen .ai-input-box {
    border: none;
    border-radius: 0;
}

.ai-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: var(--bg-secondary-color); border-bottom: 1px solid var(--border-secondary-color); }
.ai-title { font-weight: 600; font-size: 1.05rem; color: var(--fg-primary-color); display: flex; align-items: center; gap: 10px; }
.ai-title svg { color: var(--fg-accent-color); }
.ai-header-actions { display: flex; gap: 4px; }
.ai-icon-btn { background: transparent; border: none; color: var(--fg-secondary-color); cursor: pointer; padding: 6px; border-radius: 6px; display: flex; transition: all 0.2s; }
.ai-icon-btn:hover { background: var(--bg-hover-color); color: var(--fg-primary-color); }
.ai-icon-btn.danger:hover { color: var(--fg-error-color); background: var(--bg-error-color); }

/* === ВКЛАДКИ === */
.ai-tabs { display: flex; gap: 20px; padding: 0 20px; background: var(--bg-secondary-color); border-bottom: 1px solid var(--border-secondary-color); }
.ai-tab { padding: 10px 4px; background: transparent; border: none; color: var(--fg-secondary-color); cursor: pointer; font-weight: 500; font-size: 0.95rem; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.2s; }
.ai-tab:hover { color: var(--fg-primary-color); }
.ai-tab.is-active { color: var(--fg-accent-color); border-bottom-color: var(--fg-accent-color); }
.ai-tabs-content { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.ai-tab-view { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.ai-body { 
    flex: 1; 
    overflow-y: auto; 
    padding: 16px 4px; 
    display: flex; 
    flex-direction: column; 
    gap: 20px; 
}

@media (min-width: 768px) {
    .ai-body {
        padding: 16px; 
    }
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--bg-tertiary-color); border-radius: 10px; }

/* === ЧАТ (СООБЩЕНИЯ) === */
/* min-width: 0 решает проблему растягивания flex-контейнера таблицами */
.ai-history-item { display: flex; flex-direction: column; gap: 6px; width: 100%; min-width: 0; }
.ai-prompt-bubble { font-weight: 400; color: var(--fg-inverted-color); background: var(--bg-action-hover-color); padding: 10px 16px; border-radius: 18px 18px 4px 18px; align-self: flex-end; max-width: 85%; line-height: 1.5; word-break: break-word; }

.ai-response-bubble { 
    color: var(--fg-primary-color); 
    background: var(--bg-secondary-color); 
    border: 1px solid var(--border-secondary-color); 
    padding: 12px 14px; 
    border-radius: 4px 18px 18px 18px; 
    align-self: flex-start; 
    font-size: 0.95rem; 
    line-height: 1.6;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: auto; /* Позволяет скроллить контент внутри, не ломая верстку */
}

/* Стилизация таблиц в Markdown */
.ai-response-bubble table {
    width: 100%;
    max-width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    display: block; /* Важно для overflow */
    overflow-x: auto; /* Горизонтальный скролл таблицы */
}

.ai-response-bubble table th,
.ai-response-bubble table td {
    border: 1px solid var(--border-secondary-color);
    padding: 8px 12px;
}

.ai-response-bubble table th {
    background-color: var(--bg-hover-color);
    font-weight: 600;
    text-align: left;
}

/* Стилизация блоков кода, чтобы они тоже не ломали верстку */
.ai-response-bubble pre {
    max-width: 100%;
    overflow-x: auto;
    background: var(--bg-primary-color);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border-secondary-color);
    margin: 12px 0;
}

.ai-response-bubble code {
    font-family: monospace;
    font-size: 0.9em;
}

/* Кастомный горизонтальный скроллбар для таблиц и кода */
.ai-response-bubble::-webkit-scrollbar,
.ai-response-bubble table::-webkit-scrollbar,
.ai-response-bubble pre::-webkit-scrollbar {
    height: 6px;
}
.ai-response-bubble::-webkit-scrollbar-track,
.ai-response-bubble table::-webkit-scrollbar-track,
.ai-response-bubble pre::-webkit-scrollbar-track {
    background: transparent;
}
.ai-response-bubble::-webkit-scrollbar-thumb,
.ai-response-bubble table::-webkit-scrollbar-thumb,
.ai-response-bubble pre::-webkit-scrollbar-thumb {
    background-color: var(--border-secondary-color);
    border-radius: 10px;
}

.ai-status { font-size: 0.75rem; color: var(--fg-muted-color); align-self: flex-start; margin-left: 4px; }
.ai-history-item:has(.ai-prompt-bubble:last-child) .ai-status { align-self: flex-end; margin-right: 4px; }
.ai-status.error { color: var(--fg-error-color); }
.ai-status.loading { color: var(--fg-accent-color); animation: pulse-text 1.5s infinite;}
@keyframes pulse-text { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

/* === НОВОЕ ПОЛЕ ВВОДА (Modern Chat Input) === */
.ai-input-area { padding: 16px 20px; background: var(--bg-primary-color); border-top: 1px solid var(--border-secondary-color); flex-shrink: 0; }
.ai-input-box { position: relative; background: var(--bg-secondary-color); border: 1px solid var(--border-primary-color); border-radius: 14px; display: flex; flex-direction: column; transition: all 0.2s ease; }
.ai-input-box:focus-within { border-color: var(--fg-accent-color); box-shadow: 0 0 0 3px var(--bg-accent-overlay-color); }

.ai-textarea { width: 100%; min-height: 50px; max-height: 200px; background: transparent; border: none; padding: 14px 16px; padding-bottom: 48px; color: var(--fg-primary-color); font-family: inherit; font-size: 0.95rem; line-height: 1.5; resize: none; outline: none; }
.ai-textarea::placeholder { color: var(--fg-muted-color); }

.ai-input-bottom { position: absolute; bottom: 6px; left: 6px; right: 6px; display: flex; justify-content: space-between; align-items: center; background: color-mix(in srgb, var(--bg-secondary-color) 80%, transparent); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 4px; border-radius: 10px; z-index: 10; }
.ai-tools-left { display: flex; gap: 4px; align-items: center; min-width: 0; flex-shrink: 1; }

/* Кнопки Тулбара */
.ai-tool-btn { display: flex; align-items: center; gap: 6px; background: transparent; border: none; color: var(--fg-secondary-color); padding: 6px 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 0.8rem; min-width: 0; flex-shrink: 1; overflow: hidden; }
.ai-tool-btn:hover { background: var(--bg-hover-color); color: var(--fg-primary-color); }
.shrink-none { flex-shrink: 0; }
.tool-text { display: inline-block; max-width: 60px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; vertical-align: middle; }
@media (min-width: 480px) { .tool-text { max-width: 120px; } }

/* Кнопка отправки */
.ai-send-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 10px; border: none; background: var(--bg-disabled-color); color: var(--fg-muted-color); cursor: pointer; transition: all 0.2s; }
.ai-send-btn.is-ready { background: var(--bg-action-hover-color); color: var(--fg-inverted-color); }
.ai-send-btn.is-ready:hover { transform: scale(1.05); }
.ai-send-btn.is-stop { background: var(--bg-error-color); color: var(--fg-error-color); }

/* Выпадающие меню */
.ai-dropdown-wrap { position: relative; min-width: 0; flex-shrink: 1; display: flex; }
.ai-dropdown { position: absolute; bottom: calc(100% + 8px); left: 0; background: var(--bg-secondary-color); border: 1px solid var(--border-primary-color); box-shadow: 0 8px 24px rgba(0,0,0,0.15); border-radius: 12px; padding: 6px; min-width: 220px; z-index: 100; display: flex; flex-direction: column; gap: 2px; }
.dropdown-title { font-size: 0.7rem; color: var(--fg-muted-color); text-transform: uppercase; padding: 4px 8px; font-weight: 600; letter-spacing: 0.5px; }
.dropdown-item { padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; color: var(--fg-primary-color); transition: background 0.1s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
.dropdown-item:hover { background: var(--bg-hover-color); }
.dropdown-item.is-active { background: var(--bg-accent-overlay-color); color: var(--fg-accent-color); font-weight: 500; }

/* === ТОПИКИ === */
.ai-topics { display: flex; flex-direction: column; gap: 16px; padding: 0 16px; }
.topics-header { display: flex; justify-content: space-between; align-items: center; }
.topics-header h3 { margin: 0; font-size: 1.1rem; color: var(--fg-primary-color); }
.topics-empty { text-align: center; padding: 40px 0; color: var(--fg-muted-color); }
.topics-list { display: flex; flex-direction: column; gap: 8px; }
.topic-card { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--bg-secondary-color); border: 1px solid var(--border-primary-color); border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.topic-card:hover { border-color: var(--border-accent-color); }
.topic-card.is-active { border-color: var(--fg-accent-color); background: var(--bg-accent-overlay-color); }
.topic-info { display: flex; flex-direction: column; gap: 4px; }
.topic-title { font-weight: 500; color: var(--fg-primary-color); font-size: 0.95rem; }
.topic-meta { font-size: 0.75rem; color: var(--fg-muted-color); display: flex; gap: 6px; }
.topic-delete-btn { background: transparent; border: none; color: var(--fg-muted-color); padding: 6px; cursor: pointer; border-radius: 6px; opacity: 0; transition: all 0.2s; }
.topic-card:hover .topic-delete-btn { opacity: 1; }
.topic-delete-btn:hover { color: var(--fg-error-color); background: var(--bg-error-color); }

/* === НАСТРОЙКИ И ПРОМПТЫ === */
.ai-btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: all 0.2s ease; background: var(--bg-hover-color); color: var(--fg-primary-color); }
.ai-btn:hover { background: var(--bg-tertiary-color); }
.ai-btn-sm { padding: 6px 12px; font-size: 0.8rem; }
.ai-btn-primary { background: var(--fg-accent-color); color: var(--fg-inverted-color); }
.ai-btn-primary:hover { filter: brightness(1.1); }

.ai-settings { display: flex; flex-direction: column; gap: 24px; padding: 0 16px; }
.settings-block { display: flex; flex-direction: column; gap: 12px; }
.settings-block label { display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; font-weight: 500; color: var(--fg-primary-color); }

.editor-input { background: var(--bg-secondary-color); border: 1px solid var(--border-primary-color); color: var(--fg-primary-color); padding: 10px 12px; border-radius: 8px; outline: none; transition: border 0.2s; font-family: inherit; width: 100%; resize: vertical; }
.editor-input:focus { border-color: var(--fg-accent-color); box-shadow: 0 0 0 2px var(--bg-accent-overlay-color); }

.prompt-editor { background: var(--bg-secondary-color); border: 1px solid var(--border-primary-color); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 10px; }
.editor-actions { display: flex; justify-content: flex-end; gap: 8px; }

.prompts-list { display: flex; flex-direction: column; gap: 8px; }
.prompt-card { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-secondary-color); border: 1px solid var(--border-primary-color); border-radius: 10px; }
.prompt-info { flex: 1; min-width: 0; }
.prompt-name { font-weight: 500; font-size: 0.9rem; color: var(--fg-primary-color); }
.prompt-preview { font-size: 0.8rem; color: var(--fg-muted-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 4px; }
.prompt-actions { display: flex; gap: 4px; }

/* === МИНИ-ВИДЖЕТ === */
.ai-minimized-widget { position: fixed; bottom: 24px; right: 24px; background: var(--bg-secondary-color); border: 1px solid var(--border-secondary-color); border-radius: 12px; padding: 12px 20px; box-shadow: 0 12px 24px rgba(0,0,0,0.15); z-index: 99999; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s; color: var(--fg-primary-color); font-weight: 500; }
.ai-minimized-widget:hover { transform: translateY(-4px); border-color: var(--fg-accent-color); }

/* === АНИМАЦИИ === */
.ai-fade-enter-active, .ai-fade-leave-active { transition: opacity 0.2s ease; }
.ai-fade-enter-active .ai-modal, .ai-fade-leave-active .ai-modal { transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.ai-fade-enter-from, .ai-fade-leave-to { opacity: 0; }
.ai-fade-enter-from .ai-modal, .ai-fade-leave-to .ai-modal { transform: scale(0.96) translateY(10px); }

/* === СТРАНИЦА ПЛАГИНА (PAGE) === */
.ai-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 50px);
  gap: 8px;
  padding: 8px 0 0 0;
}
@media (min-width: 768px) {
  .ai-page {
    padding: 16px;
    gap: 16px;
  }
}

.ai-page-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}
@media (min-width: 768px) {
  .ai-page-header {
    padding: 0;
  }
}

.ai-page-header h2 {
  margin: 0;
  color: var(--fg-primary-color);
}
.ai-page-header-actions {
  display: flex;
  gap: 8px;
}
.ai-page-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-secondary-color);
  border: 1px solid var(--border-secondary-color);
  color: var(--fg-secondary-color);
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.ai-page-btn:hover {
  background: var(--bg-hover-color);
  color: var(--fg-primary-color);
}
.ai-page-btn.is-active {
  color: var(--fg-accent-color);
  border-color: var(--border-accent-color);
  background: var(--bg-accent-overlay-color);
}
@media (max-width: 600px) {
  .ai-page-btn .btn-text {
    display: none;
  }
  .ai-page-btn {
    padding: 8px;
  }
}

.ai-page-chat-wrapper {
  flex: 1;
  border: none;
  border-top: 1px solid var(--border-secondary-color);
  border-radius: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary-color);
}
@media (min-width: 768px) {
  .ai-page-chat-wrapper {
    border: 1px solid var(--border-secondary-color);
    border-radius: 8px;
  }
}

.ai-page {
  .ai-tab-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .ai-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 8px;
  }
  .ai-input-box {
    border: none;
    border-radius: 0;
  }
  .ai-input-area {
    flex-shrink: 0;
    padding: 0;
  }
}
@media (min-width: 768px) {
  .ai-page .ai-body {
    padding: 16px;
  }
}
`, Vn = {
  id: "ai-assistant",
  name: "AI Assistant",
  description: "AI-помощник с фоновым выполнением запросов",
  version: "1.0.0",
  icon: "mdi:robot-outline",
  slots: {
    toolbar: window.Vue.markRaw(wn)
  },
  pages: {
    index: window.Vue.markRaw(bn)
  },
  styles: xn,
  activate(l) {
    x.setContext(l), console.log("[AI Assistant] Activated");
  }
};
export {
  Vn as default
};
