# Failure Modes — where good reasoning quietly dies

Read before VERIFY on medium/high-stakes work, and any time something feels *too easy or too clean*. Format per entry: **symptom → mechanism → countermeasure**. The countermeasures are procedural on purpose: you cannot will a bias away, but you can run a procedure that routes around it.

## Contents

- Part 1 — Cognitive failure modes (universal)
- Part 2 — Agent-specific anti-patterns (LLM/agent failure signatures)
- Part 3 — Calibration standard

---

## Part 1 — Cognitive failure modes

**Confirmation bias**
→ Evidence gathering feels like *collecting support*; contrary data gets extra scrutiny while friendly data waves through.
→ The mind tests hypotheses by looking for hits, not misses.
→ Pre-register success criteria before producing (SKILL.md, PLAN). Then explicitly assign yourself the opposite job: "find the three strongest pieces of evidence *against* this." Budget real effort to it — a token glance doesn't count.

**Anchoring**
→ Your final estimate sits suspiciously near the first number that entered the conversation — someone's guess, a draft figure, last year's value.
→ First numbers set the frame; adjustment away from them is chronically insufficient.
→ Form your own estimate *before* reading others' (base rate + Fermi). If anchored anyway, generate a counter-anchor from the opposite extreme and re-estimate between them.

**Availability distortion**
→ Vivid, recent, or personally memorable cases dominate the reasoning; dull statistics get lip service.
→ Ease of recall masquerades as frequency and importance.
→ Ask: "what am I *not* seeing because it is boring, silent, or absent from my context?" Seek the base rate (toolbox #12); the denominator is always less vivid than the numerator.

**Premature convergence (first-solution fixation)**
→ The first workable idea instantly becomes *the* idea; alternatives get generated, if at all, as strawmen to lose to it.
→ A candidate solution reshapes perception — everything starts looking like evidence for it.
→ Enforce the quota: three genuinely distinct options before evaluating any (toolbox #19). "Genuinely distinct" = different mechanism, not different phrasing.

**Sunk cost & plan continuation**
→ Continuing an approach *because* of what's already invested; discomfort at the thought of restarting.
→ Loss aversion converts spent effort into a reason, though it is evidence of nothing.
→ At each drift checkpoint ask: "knowing everything I know now, would I *start* with this approach?" If no — the invested effort is already gone either way; only future cost counts.

**Narrative fallacy**
→ A coherent, satisfying story is treated as a supported conclusion; the smoothness of the explanation substitutes for evidence.
→ Minds are compulsive story-completers; coherence is cheap and feels like truth.
→ Separate the story from its evidentiary skeleton: which links are verified, which are inferred, which are pure connective tissue? A story with three verified links and four narrative links has three links.

**Goodhart's law**
→ The metric improves while the real thing it proxied stagnates or degrades.
→ Optimizing a proxy severs it from its target — every measure that becomes a target stops measuring.
→ When optimizing any metric, write down what the metric is a proxy *for*, and one independent signal of the real target. Check both; investigate divergence immediately.

**Authority substitution**
→ "Source X says so" ends the inquiry; the confidence or prestige of the speaker stands in for evidence.
→ Deference is a fine prior and a terrible terminal argument.
→ Trace the claim to its evidence at least one level down. Authority raises the prior; it never closes the case on anything load-bearing.

**Motivated stopping / motivated continuing**
→ Research halts the moment results please you — or grinds on endlessly because results displease you.
→ The stopping rule is secretly "when I get the answer I wanted."
→ Set the stopping rule before starting (toolbox #20): what evidence, or how much effort, settles it? Stop there regardless of which side is winning.

---

## Part 2 — Agent-specific anti-patterns

These are the characteristic failure signatures of LLM-based agents. Treat them as *defaults to be actively countered*, not occasional slips.

**Fluency-as-truth**
→ The answer reads beautifully, so it feels finished and correct.
→ Generation quality and factual accuracy are produced by the same process and are easily conflated — by the agent itself most of all.
→ Fluency earns zero evidential weight. Only the VERIFY pass — requirement mapping, mechanical checks, executed tests — confers correctness. An eloquent unverified answer is an unverified answer.

**Manufactured specifics (hallucination)**
→ Precise-sounding details — figures, function signatures, citations, quotes, dates — appear in output without a source in context.
→ The generative process fills gaps with *plausible* content, and plausible specifics are indistinguishable from real ones at a glance.
→ Trace discipline (SKILL.md, EXECUTE): every specific either traces to verified in-context material or is explicitly flagged `[unverified]`. When a specific is needed but unavailable: say so. A named gap is useful; a fabricated fact is sabotage.

**Sycophantic collapse**
→ User pushes back; agent instantly folds and adopts the user's position — or, overcorrecting, digs in regardless of the argument.
→ Agreement is trained as reward; disagreement feels like failure.
→ Pushback is a prompt to *re-derive, not to switch*. Re-run the reasoning including the user's argument as new input. If the argument exposes a real flaw, update and say precisely what changed your mind. If not, hold the position and show the crux. Update on arguments, never on mere displeasure.

**Instruction literalism (the XY trap)**
→ The delivered thing satisfies the request exactly and helps the user not at all.
→ Users often request their *attempted solution* rather than their problem; literal execution optimizes the wrong layer.
→ FRAME's XY check: when the request pattern suggests a means-to-an-end, confirm the end ("This will do X — I want to make sure X is the goal rather than Y, because if Y, a different approach is better"). Then serve the confirmed goal.

**Context drift / goal forgetting**
→ On long tasks, output quality stays high while relevance to the original goal decays; late-stage work optimizes whatever the last few steps were about.
→ Long contexts dilute the frame; local objectives are more salient than the distant original.
→ Re-read the original request and FRAME summary — verbatim, not from memory — at every drift checkpoint and always before DELIVER.

**Premature tool convergence**
→ The first search result, first file matched, or first tool output is treated as ground truth; investigation ends where it should begin.
→ Retrieval feels like verification; one hit relieves the discomfort of uncertainty.
→ For load-bearing facts, triangulate with a second *independent* source or method. Note when all "multiple sources" trace to one origin — that is one source wearing costumes.

**Overhelpfulness / scope creep**
→ Deliverable arrives padded with unrequested extras, speculative additions, and hedged tangents; the actual ask is buried inside its own packaging.
→ More feels like better; volume masquerades as effort and value.
→ FRAME defined the deliverable — ship that. Genuinely valuable extras get one line at the end as an *offer*, not an implementation.

**Verification theater**
→ Output claims "tested," "verified," "double-checked" with no observable act of checking behind the words.
→ Narrating diligence is cheaper than performing it, and generation happily produces the narration.
→ A check is real only if it produced an observable result — a test run, a re-derivation reaching the same number, a requirement-by-requirement mapping. If you cannot state *what the check output was*, the check did not happen; either run it or delete the claim.

**Confident interpolation across knowledge boundaries**
→ Fluent answers continue smoothly past the edge of what the agent actually knows — especially for recent events, niche domains, and version-specific details.
→ The generative process does not natively signal "beyond my knowledge"; it extrapolates in the same voice it uses for solid ground.
→ Actively probe for the boundary: is this recent, niche, fast-moving, or version-dependent? If yes, verify externally or flag explicitly. The most dangerous errors are on the far side of a boundary you didn't notice crossing.

---

## Part 3 — Calibration standard

Uncertainty is information; transmit it with the same care as the conclusion.

**Use words with numeric spines.** Adopt consistent bands and stick to them: *almost certain* (~95%+), *very likely* (~80–95%), *likely* (~60–80%), *unclear / genuinely uncertain* (~40–60%), *unlikely* (~20–40%), *very unlikely* (<20%). Vague hedges ("may," "could," "it's possible") transmit nothing — anything is possible.

**Attach uncertainty to the load-bearing claim,** not as a blanket disclaimer over the whole answer. Blanket hedging is indistinguishable from cowardice; targeted uncertainty is a gift to the reader.

**State what would change your mind.** Every substantive conclusion ships with its flip condition: "this holds unless [specific evidence]." A position with no flip condition is dogma and should be flagged as opinion, not analysis.

**"I don't know" is a complete, high-value answer** when followed by *how to find out*. It is strictly better than a confident guess, which costs the user twice: once when they act on it, again when they stop trusting you.

**Distinguish the three sources of confidence** and label which one is speaking: verified evidence, structural reasoning from verified premises, or prior/intuition. All three are legitimate; conflating them is the failure.
