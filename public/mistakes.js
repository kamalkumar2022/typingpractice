/**
 * SSC-style typing mistake analysis (Full / Half mistakes).
 *
 * Rules follow the SSC CGL / CHSL DEST evaluation scheme
 * (see https://typingsathi.com/blog/ssc-cgl-typing-error-calculation/):
 *
 *   Full mistakes  – omission, substitution, addition (incl. irrelevant matter),
 *                    spelling, repetition, incomplete word.
 *   Half mistakes  – spacing, capitalisation, punctuation, transposition (of
 *                    adjacent words), paragraphic (paragraph break / indentation).
 *
 * A full mistake costs all keystrokes of the word, a half mistake costs half of them.
 *
 * One mistake, counted once: a single word / unit can match several categories
 * (e.g. "well-known" -> "well known" is both a spacing and a punctuation error).
 * It is listed under every matching category in the breakdown, but in the
 * totals it is counted only once — as one full mistake if any of its
 * categories is a full mistake, otherwise as one half mistake. Such mistakes
 * are also listed under "Multiple Types of Full / Half Error" so the breakdown
 * can be reconciled with the totals.
 *
 * The part of the passage after the last typed word ("untyped words") is not
 * counted as a mistake; the error percentage is computed on what was typed.
 *
 * Why an aligner?  The previous implementation compared word i of the passage
 * with word i of the typed text.  A single skipped or extra word shifted every
 * following word, producing a cascade of bogus substitution / spelling /
 * capitalisation errors, and several detectors reported the same word under
 * multiple categories.  Here the two word sequences are aligned once with a
 * weighted edit-distance (dynamic programming) that understands every SSC error
 * type as an edit operation.
 */
(function (root) {
    'use strict';

    const FULL = 'full';
    const HALF = 'half';

    const TYPES = {
        omission:       { severity: FULL, label: 'Omission Errors' },
        substitution:   { severity: FULL, label: 'Substitution Errors' },
        addition:       { severity: FULL, label: 'Addition Errors' },
        spelling:       { severity: FULL, label: 'Spelling Errors' },
        repetition:     { severity: FULL, label: 'Repetition Errors' },
        incompletion:   { severity: FULL, label: 'Incompletion Errors' },
        spacing:        { severity: HALF, label: 'Spacing Errors' },
        capitalisation: { severity: HALF, label: 'Capitalisation Errors' },
        punctuation:    { severity: HALF, label: 'Punctuation Errors' },
        transposition:  { severity: HALF, label: 'Transposition Errors' },
        paragraphic:    { severity: HALF, label: 'Paragraphic Errors' },
    };

    // Summary categories: one mistake that matched several categories above
    // but is counted only once (as a full mistake if any category is full).
    const COMBINED_TYPES = {
        multipleFull: { severity: FULL, label: 'Multiple Types of Full Error' },
        multipleHalf: { severity: HALF, label: 'Multiple Types of Half Error' },
    };

    // ---- Alignment costs (only used to pick the most plausible alignment) ----
    // Substitution is cheaper than omission + addition (SSC counts a replaced
    // word as ONE full mistake), but costlier than a single omission so that a
    // skipped word is never explained as a chain of substitutions.
    const COST = {
        half: 0.3,          // case-only or punctuation-only difference
        halfBoth: 0.4,      // case + punctuation difference
        spelling: 0.9,      // misspelt / incomplete word
        substitution: 1.9,
        omission: 0.95,
        addition: 1.0,
        punctOnly: 0.4,     // a standalone punctuation token missing / extra
        spacingExact: 0.5,  // words joined / split, otherwise identical
        spacingLoose: 0.7,  // joined / split + case or punctuation difference
        transposition: 0.5,
    };
    const MAX_MERGE = 3;    // "I hope you" -> "Ihopeyou"
    const MAX_SPLIT = 4;    // "have" -> "h a v e"

    const OP_PAIR = 1, OP_INS = 2, OP_DEL = 3, OP_TRANS = 4, OP_MERGE = 5, OP_SPLIT = 6;

    // Letters, digits and combining marks (needed for Hindi matras) are "content";
    // everything else is punctuation.
    let NON_CONTENT, CONTENT, FIGURE;
    try {
        NON_CONTENT = new RegExp('[^\\p{L}\\p{N}\\p{M}]', 'gu');
        CONTENT = new RegExp('[\\p{L}\\p{N}\\p{M}]', 'gu');
        FIGURE = new RegExp('^\\p{N}+$', 'u');
    } catch (e) {
        NON_CONTENT = /[^A-Za-z0-9\u00C0-\u024F\u0900-\u097F]/g;
        CONTENT = /[A-Za-z0-9\u00C0-\u024F\u0900-\u097F]/g;
        FIGURE = /^[0-9\u0966-\u096F]+$/;
    }

    function stripPunct(s) {
        return s.replace(NON_CONTENT, '');
    }

    /** Punctuation marks of a string, order-independent (for transposition checks). */
    function punctSignature(s) {
        return s.replace(CONTENT, '').split('').sort().join('');
    }

    function tokenize(text) {
        const tokens = [];
        const re = /\S+/g;
        let m;
        let last = 0;
        while ((m = re.exec(text)) !== null) {
            const ws = text.slice(last, m.index);
            const nl = ws.lastIndexOf('\n');
            const isFirst = tokens.length === 0;
            const lineIndent = nl !== -1 ? ws.slice(nl + 1) : (isFirst ? ws : '');
            const raw = m[0];
            const lower = raw.toLowerCase();
            const core = stripPunct(raw);
            tokens.push({
                text: raw,
                lower: lower,
                core: core,
                coreLower: core.toLowerCase(),
                isPunct: core.length === 0,
                breakBefore: isFirst || nl !== -1,
                // A tab or 2+ spaces at the start of a line counts as indentation
                // (a tab is rendered as 4 spaces in the passage, so both are accepted).
                indented: /\t/.test(lineIndent) || lineIndent.replace(/[\r\n]/g, '').length >= 2,
            });
            last = m.index + raw.length;
        }
        return tokens;
    }

    /** Optimal string alignment distance (Levenshtein + adjacent transposition). */
    function osaDistance(a, b) {
        const al = a.length, bl = b.length;
        if (al === 0) return bl;
        if (bl === 0) return al;
        let prev2 = null;
        let prev = new Array(bl + 1);
        for (let j = 0; j <= bl; j++) prev[j] = j;
        for (let i = 1; i <= al; i++) {
            const cur = new Array(bl + 1);
            cur[0] = i;
            for (let j = 1; j <= bl; j++) {
                const sub = a[i - 1] === b[j - 1] ? 0 : 1;
                let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + sub);
                if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                    v = Math.min(v, prev2[j - 2] + 1);
                }
                cur[j] = v;
            }
            prev2 = prev;
            prev = cur;
        }
        return prev[bl];
    }

    /**
     * If `a` and `b` differ only by case and/or punctuation, return the list of
     * half-mistake kinds involved ([] when identical). Otherwise return null.
     */
    function halfKinds(a, b) {
        if (a === b) return [];
        if (a.toLowerCase() === b.toLowerCase()) return ['capitalisation'];
        const ca = stripPunct(a), cb = stripPunct(b);
        if (ca === cb) return ['punctuation'];          // includes punctuation-only tokens
        if (ca.length > 0 && ca.toLowerCase() === cb.toLowerCase()) {
            return ['capitalisation', 'punctuation'];
        }
        return null;
    }

    const RES_MATCH = { cost: 0, kinds: [] };
    const RES_CAP = { cost: COST.half, kinds: ['capitalisation'] };
    const RES_PUNCT = { cost: COST.half, kinds: ['punctuation'] };
    const RES_CAP_PUNCT = { cost: COST.halfBoth, kinds: ['capitalisation', 'punctuation'] };
    const RES_INCOMPLETE = { cost: COST.spelling, kinds: ['incompletion'] };
    const RES_SPELLING = { cost: COST.spelling, kinds: ['spelling'] };
    const RES_SUBST = { cost: COST.substitution, kinds: ['substitution'] };

    function classifyPair(o, t) {
        if (o.text === t.text) return RES_MATCH;
        if (o.lower === t.lower) return RES_CAP;
        if (o.core === t.core) return RES_PUNCT;                  // includes punctuation-only tokens
        if (o.isPunct || t.isPunct) return RES_SUBST;             // aligner will prefer omission + addition
        if (o.coreLower === t.coreLower) return RES_CAP_PUNCT;
        const ow = o.coreLower, tw = t.coreLower;
        // Spelling / incomplete-word errors apply to words; a wrong figure
        // (e.g. 2023 -> 2032 or 2023 -> 203) is a substitution.
        if (FIGURE.test(ow) || FIGURE.test(tw)) return RES_SUBST;
        if (tw.length < ow.length && ow.startsWith(tw)) return RES_INCOMPLETE;
        const maxLen = Math.max(ow.length, tw.length);
        if (Math.abs(ow.length - tw.length) <= Math.ceil(maxLen / 2) && osaDistance(ow, tw) / maxLen <= 0.5) {
            return RES_SPELLING;
        }
        return RES_SUBST;
    }

    /** Classify a 1:1 word pairing, cached per distinct (original, typed) pair. */
    function makePairClassifier(O, T) {
        // Intern token texts so the cache can use cheap numeric keys.
        const ids = new Map();
        const intern = tok => {
            let id = ids.get(tok.text);
            if (id === undefined) { id = ids.size; ids.set(tok.text, id); }
            tok.id = id;
        };
        O.forEach(intern);
        T.forEach(intern);
        const N = ids.size;
        const cache = new Map();
        return function classify(o, t) {
            if (o.id === t.id) return RES_MATCH;
            const key = o.id * N + t.id;
            let res = cache.get(key);
            if (res === undefined) {
                res = classifyPair(o, t);
                cache.set(key, res);
            }
            return res;
        };
    }

    function joinText(tokens, from, to) {
        let s = '';
        for (let k = from; k < to; k++) s += tokens[k].text;
        return s;
    }

    /** Prefix sums of core (letters/digits) lengths, for O(1) range length checks. */
    function corePrefix(tokens) {
        const p = new Int32Array(tokens.length + 1);
        for (let k = 0; k < tokens.length; k++) p[k + 1] = p[k] + tokens[k].coreLower.length;
        return p;
    }

    /** Weighted alignment of original vs typed tokens. Returns ordered ops. */
    function align(O, T) {
        const n = O.length, m = T.length;
        const W = m + 1;
        const D = new Float64Array((n + 1) * W).fill(Infinity);
        const OP = new Uint8Array((n + 1) * W);
        const ARG = new Uint8Array((n + 1) * W);
        const classify = makePairClassifier(O, T);
        const pO = corePrefix(O), pT = corePrefix(T);
        D[0] = 0;

        for (let i = 0; i <= n; i++) {
            const row = i * W, prevRow = row - W;
            for (let j = 0; j <= m; j++) {
                if (i === 0 && j === 0) continue;
                let best = Infinity, op = 0, arg = 0;

                // 1:1 pairing (match / half / spelling / incomplete / substitution)
                if (i > 0 && j > 0) {
                    const c = D[prevRow + j - 1] + classify(O[i - 1], T[j - 1]).cost;
                    if (c < best) { best = c; op = OP_PAIR; }
                }
                // Transposition of two adjacent words
                if (i > 1 && j > 1) {
                    const o1 = O[i - 2], o2 = O[i - 1], t1 = T[j - 2], t2 = T[j - 1];
                    if (!o1.isPunct && !o2.isPunct && o1.coreLower !== o2.coreLower &&
                        o1.coreLower === t2.coreLower && o2.coreLower === t1.coreLower) {
                        const c = D[prevRow - W + j - 2] + COST.transposition;
                        if (c < best) { best = c; op = OP_TRANS; }
                    }
                }
                // Omission (original word not typed)
                if (i > 0) {
                    const c = D[prevRow + j] + (O[i - 1].isPunct ? COST.punctOnly : COST.omission);
                    if (c < best) { best = c; op = OP_DEL; }
                }
                // Addition (extra typed word)
                if (j > 0) {
                    const c = D[row + j - 1] + (T[j - 1].isPunct ? COST.punctOnly : COST.addition);
                    if (c < best) { best = c; op = OP_INS; }
                }
                // Missing space: k original words typed as one word
                if (j > 0) {
                    const t = T[j - 1];
                    for (let k = 2; k <= MAX_MERGE && k <= i; k++) {
                        if (pO[i] - pO[i - k] !== t.coreLower.length) continue;
                        if (!t.coreLower.startsWith(O[i - k].coreLower)) continue;
                        const hk = halfKinds(joinText(O, i - k, i), t.text);
                        if (!hk) continue;
                        const c = D[(i - k) * W + j - 1] + (hk.length ? COST.spacingLoose : COST.spacingExact);
                        if (c < best) { best = c; op = OP_MERGE; arg = k; }
                    }
                }
                // Extra space: one original word typed as k pieces
                if (i > 0) {
                    const o = O[i - 1];
                    for (let k = 2; k <= MAX_SPLIT && k <= j; k++) {
                        if (pT[j] - pT[j - k] !== o.coreLower.length) continue;
                        if (!o.coreLower.startsWith(T[j - k].coreLower)) continue;
                        const hk = halfKinds(o.text, joinText(T, j - k, j));
                        if (!hk) continue;
                        const c = D[prevRow + j - k] + (hk.length ? COST.spacingLoose : COST.spacingExact);
                        if (c < best) { best = c; op = OP_SPLIT; arg = k; }
                    }
                }

                D[row + j] = best;
                OP[row + j] = op;
                ARG[row + j] = arg;
            }
        }

        // Where did the candidate stop typing? The untyped tail of the passage
        // is made marginally cheaper than a mid-text omission, so on ties the
        // alignment ends as early as possible (e.g. a garbled last word is
        // paired with the next expected word, not with a later one).
        const TAIL_DISCOUNT = 0.01;
        let iEnd = n, bestEnd = Infinity, tail = 0;
        for (let i = n; i >= 0; i--) {
            if (i < n) tail += (O[i].isPunct ? COST.punctOnly : COST.omission) - TAIL_DISCOUNT;
            const c = D[i * W + m] + tail;
            if (c <= bestEnd) { bestEnd = c; iEnd = i; }
        }

        const ops = [];
        let i = iEnd, j = m;
        while (i > 0 || j > 0) {
            const idx = i * W + j;
            const op = OP[idx], arg = ARG[idx];
            switch (op) {
                case OP_PAIR:  ops.push({ op, oi: i - 1, oj: i, ti: j - 1, tj: j }); i--; j--; break;
                case OP_TRANS: ops.push({ op, oi: i - 2, oj: i, ti: j - 2, tj: j }); i -= 2; j -= 2; break;
                case OP_DEL:   ops.push({ op, oi: i - 1, oj: i, ti: j, tj: j }); i--; break;
                case OP_INS:   ops.push({ op, oi: i, oj: i, ti: j - 1, tj: j }); j--; break;
                case OP_MERGE: ops.push({ op, oi: i - arg, oj: i, ti: j - 1, tj: j }); i -= arg; j--; break;
                case OP_SPLIT: ops.push({ op, oi: i - 1, oj: i, ti: j - arg, tj: j }); i--; j -= arg; break;
                default: throw new Error('Alignment traceback failed at ' + i + ',' + j);
            }
        }
        ops.reverse();

        return { ops, classify };
    }

    function keystrokes(tokens, from, to) {
        let n = 0;
        for (let k = from; k < to; k++) n += tokens[k].text.length;
        return n;
    }

    function textOf(tokens, from, to) {
        return tokens.slice(from, to).map(t => t.text).join(' ');
    }

    function sameSeq(T, a, b, len) {
        if (a < 0 || b < 0 || a + len > T.length || b + len > T.length) return false;
        for (let k = 0; k < len; k++) {
            if (T[a + k].coreLower !== T[b + k].coreLower || T[a + k].isPunct) return false;
        }
        return true;
    }

    /**
     * Analyse typed text against the original passage.
     * @returns {{
     *   mistakes: Array<{type:string,severity:string,original:string,typed:string,count:number,keystrokes:number,note?:string}>,
     *   byType: Object<string, Array>,
     *   fullCount: number, halfCount: number,
     *   errorKeystrokes: number, typedKeystrokes: number, errorPercent: number,
     *   correctWords: number, attemptedWords: number, totalWords: number, untypedWords: number
     * }}
     */
    function analyze(originalText, typedText) {
        originalText = (originalText || '').replace(/\u00A0/g, ' ').normalize('NFC');
        typedText = (typedText || '').replace(/\u00A0/g, ' ').normalize('NFC');

        const O = tokenize(originalText);
        const T = tokenize(typedText);

        // Bound the DP: passage words far beyond what was typed can never be
        // aligned and are simply "not typed".
        const limit = Math.min(O.length, Math.max(2 * T.length, T.length + 100) + 10);
        const Oa = O.slice(0, limit);

        const { ops: allOps, classify } = align(Oa, T);

        // Trailing omissions after the last typed word are simply the part of
        // the passage the candidate did not reach. Cut them off here so they are
        // reported once (as "Untyped words") together with anything beyond the
        // DP limit, and so attempted / untyped word stats are accurate.
        let opsEnd = allOps.length;
        while (opsEnd > 0 && allOps[opsEnd - 1].op === OP_DEL) opsEnd--;
        const ops = allOps.slice(0, opsEnd);
        const attempted = opsEnd > 0 ? ops[opsEnd - 1].oj : 0;
        const mistakes = [];

        const add = (type, original, typed, ks, count, note) => {
            mistakes.push({
                type,
                severity: TYPES[type].severity,
                original,
                typed,
                count: count || 1,
                keystrokes: ks,
                note: note || '',
            });
        };

        let correctWords = 0;
        // Paragraph breaks attached to skipped / extra words carry forward to
        // the next aligned word so they are not reported twice.
        let pendO = null, pendT = null;

        const checkParagraph = (o, t) => {
            const oBreak = o.breakBefore || !!pendO;
            const tBreak = t.breakBefore || !!pendT;
            const oInd = pendO ? pendO.indented : o.indented;
            const tInd = pendT ? pendT.indented : t.indented;
            pendO = pendT = null;
            if (oBreak && !tBreak) {
                add('paragraphic', '¶ ' + o.text, t.text, o.text.length, 1, 'Missing paragraph break');
                return true;
            }
            if (!oBreak && tBreak) {
                add('paragraphic', o.text, '¶ ' + t.text, o.text.length, 1, 'Extra paragraph break');
                return true;
            }
            if (oBreak && tBreak && oInd !== tInd) {
                add('paragraphic', (oInd ? '⇥ ' : '') + o.text, (tInd ? '⇥ ' : '') + t.text, o.text.length, 1,
                    oInd ? 'Missing indentation' : 'Extra indentation');
                return true;
            }
            return false;
        };

        for (let k = 0; k < ops.length; k++) {
            const a = ops[k];

            if (a.op === OP_DEL) {
                // Group consecutive omitted words into one entry.
                let end = k;
                while (end + 1 < ops.length && ops[end + 1].op === OP_DEL) end++;
                let runStart = -1;
                const flush = (upto) => {
                    if (runStart === -1) return;
                    const from = ops[runStart].oi, to = ops[upto].oj;
                    add('omission', textOf(Oa, from, to), '', keystrokes(Oa, from, to), to - from);
                    runStart = -1;
                };
                for (let x = k; x <= end; x++) {
                    const o = Oa[ops[x].oi];
                    if (o.breakBefore && !pendO) pendO = o;
                    if (o.isPunct) {
                        flush(x - 1);
                        add('punctuation', o.text, '', o.text.length, 1, 'Punctuation omitted');
                    } else if (runStart === -1) {
                        runStart = x;
                    }
                }
                flush(end);
                k = end;
                continue;
            }

            if (a.op === OP_INS) {
                let end = k;
                while (end + 1 < ops.length && ops[end + 1].op === OP_INS) end++;
                const s = ops[k].ti, e = ops[end].tj, len = e - s;
                for (let x = s; x < e; x++) {
                    if (T[x].breakBefore && !pendT) pendT = T[x];
                }
                // Whole run repeats the words right before / after it -> repetition.
                if (len > 0 && (sameSeq(T, s - len, s, len) || sameSeq(T, e, s, len))) {
                    add('repetition', '', textOf(T, s, e), keystrokes(T, s, e), len);
                } else {
                    let runStart = -1, runType = null;
                    const flush = (upto) => {
                        if (runStart === -1) return;
                        add(runType, '', textOf(T, runStart, upto), keystrokes(T, runStart, upto), upto - runStart);
                        runStart = -1;
                        runType = null;
                    };
                    for (let x = s; x < e; x++) {
                        const t = T[x];
                        if (t.isPunct) {
                            flush(x);
                            add('punctuation', '', t.text, t.text.length, 1, 'Extra punctuation');
                            continue;
                        }
                        const repeated = (x > 0 && !T[x - 1].isPunct && T[x - 1].coreLower === t.coreLower) ||
                            (x + 1 < T.length && !T[x + 1].isPunct && T[x + 1].coreLower === t.coreLower);
                        const type = repeated ? 'repetition' : 'addition';
                        if (runType !== type) flush(x);
                        if (runStart === -1) { runStart = x; runType = type; }
                    }
                    flush(e);
                }
                k = end;
                continue;
            }

            const startIndex = mistakes.length;
            const o0 = Oa[a.oi], t0 = T[a.ti];
            const paraErr = checkParagraph(o0, t0);

            if (a.op === OP_PAIR) {
                const res = classify(o0, t0);
                if (res.kinds.length === 0) {
                    if (!paraErr) correctWords++;
                } else {
                    const ks = o0.text.length;
                    for (const kind of res.kinds) {
                        add(kind, o0.text, t0.text, ks, 1);
                    }
                }
            } else if (a.op === OP_TRANS) {
                const origStr = textOf(Oa, a.oi, a.oj);
                const typedStr = textOf(T, a.ti, a.tj);
                const ks = keystrokes(Oa, a.oi, a.oj);
                add('transposition', origStr, typedStr, ks, 1);
                if (punctSignature(joinText(Oa, a.oi, a.oj)) !== punctSignature(joinText(T, a.ti, a.tj))) {
                    add('punctuation', origStr, typedStr, ks, 1);
                }
            } else if (a.op === OP_MERGE || a.op === OP_SPLIT) {
                const origStr = textOf(Oa, a.oi, a.oj);
                const typedStr = textOf(T, a.ti, a.tj);
                const ks = keystrokes(Oa, a.oi, a.oj);
                add('spacing', origStr, typedStr, ks, 1, a.op === OP_MERGE ? 'Missing space' : 'Extra space');
                const hk = halfKinds(joinText(Oa, a.oi, a.oj), joinText(T, a.ti, a.tj)) || [];
                for (const kind of hk) add(kind, origStr, typedStr, ks, 1);
            }

            const numAdded = mistakes.length - startIndex;
            if (numAdded > 1) {
                const list = mistakes.slice(startIndex);
                const isFull = list.some(m => m.severity === FULL);
                const combinedType = isFull ? 'multipleFull' : 'multipleHalf';
                const main = list.find(m => m.type !== 'paragraphic') || list[0];
                const typesStr = list.map(m => TYPES[m.type].label.replace(' Errors', '')).join(' + ');
                
                const combined = {
                    type: combinedType,
                    severity: isFull ? FULL : HALF,
                    original: main.original,
                    typed: main.typed,
                    count: 1,
                    keystrokes: main.keystrokes,
                    note: typesStr
                };
                for (let i = startIndex; i < mistakes.length; i++) {
                    mistakes[i].ignoreForTotal = true;
                }
                mistakes.push(combined);
            }
        }

        // Untyped tail is no longer added to mistakes. We just calculate stats.

        const byType = {};
        Object.keys(TYPES).forEach(t => { byType[t] = []; });
        Object.keys(COMBINED_TYPES).forEach(t => { byType[t] = []; });
        let fullCount = 0, halfCount = 0, errorKeystrokes = 0;
        for (const mk of mistakes) {
            byType[mk.type].push(mk);
            if (!mk.ignoreForTotal) {
                if (mk.severity === FULL) {
                    fullCount += mk.count;
                    errorKeystrokes += mk.keystrokes;
                } else {
                    halfCount += mk.count;
                    errorKeystrokes += mk.keystrokes / 2;
                }
            }
        }

        const typedKeystrokes = typedText.replace(/\s+$/, '').length;
        const attemptedOriginalKeystrokes = keystrokes(O, 0, attempted);
        return {
            mistakes,
            byType,
            fullCount,
            halfCount,
            totalMistakeCount: fullCount + halfCount,
            errorKeystrokes,
            typedKeystrokes,
            originalKeystrokes: attemptedOriginalKeystrokes,
            errorPercent: attemptedOriginalKeystrokes > 0 ? Math.min(100, (errorKeystrokes / attemptedOriginalKeystrokes) * 100) : 0,
            correctWords,
            attemptedWords: attempted,
            totalOriginalWords: O.length,
            untypedWords: O.length - attempted,
        };
    }

    const api = { analyze, TYPES, FULL, HALF };
    root.TypingMistakes = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
