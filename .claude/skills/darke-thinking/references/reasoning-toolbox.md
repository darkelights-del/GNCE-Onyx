# Reasoning Toolbox

Twenty techniques, grouped by function. Each entry: when to reach for it, how to run it, and how it fails. Selection heuristic: match the technique to the *shape* of the difficulty, not the domain. A hard problem is usually only hard in its current representation.

## Contents

- **A. Decomposition & representation** (1–8): the problem is too big, tangled, or opaque
- **B. Inference & evidence** (9–14): the problem is deciding what is true
- **C. Foresight & judgment** (15–20): the problem is choosing well under uncertainty

---

## A. Decomposition & representation

### 1. First-principles decomposition
**Reach for it when:** conventional approaches feel arbitrary, inherited, or overpriced; you suspect the "standard way" carries dead assumptions.
**Run it:** strip the problem to its invariants — physics, math, definitions, genuinely hard requirements. List what *must* be true versus what is merely customary. Rebuild the solution upward from the invariants only.
**It fails when:** you misclassify a real constraint as convention (rediscovering why the fence was built, expensively), or spend first-principles effort on a solved commodity problem.

### 2. Inversion
**Reach for it when:** the forward question ("how do I succeed?") produces vague answers.
**Run it:** ask the opposite — "what would guarantee failure here?" Enumerate the failure conditions concretely, then design to avoid each. Avoiding stupidity is more tractable than seeking brilliance.
**It fails when:** used alone — it prevents disaster but does not generate excellence. Pair with a generative technique.

### 3. Backward chaining (goal regression)
**Reach for it when:** the goal state is crisp but the path is unclear.
**Run it:** start at the goal. Ask "what must be true immediately before this?" Recurse until you reach the current state. The chain, reversed, is the plan — and it exposes prerequisites forward planning misses.
**It fails when:** the goal itself is underspecified (backward chaining amplifies a wrong target) or multiple paths exist and you lock onto the first chain found.

### 4. Divide and conquer / bisection
**Reach for it when:** a failure or property hides somewhere inside a large system, sequence, or dataset.
**Run it:** split the space in half; test which half contains the target; recurse. Localizes in log time what linear inspection finds in linear time. The core of all serious debugging.
**It fails when:** the halves interact (the bug only appears when both halves are present) or the test itself is unreliable — verify your probe before trusting the bisection.

### 5. Toy model
**Reach for it when:** the full problem is too large to hold in your head.
**Run it:** shrink every dimension until the problem is solvable by hand — 3 items instead of 3 million, 1 dimension instead of 10, integers instead of reals. Solve the toy completely. Extract the *mechanism* of the solution, then scale it back up, checking what breaks at each size increase.
**It fails when:** the difficulty is emergent — present only at scale — so the toy solves a different problem. Note explicitly what the shrinking removed.

### 6. Extreme and boundary cases
**Reach for it when:** testing a claim, design, formula, or intuition for hidden breakage.
**Run it:** push each variable to 0, 1, negative, infinity, empty, and enormous. Watch what breaks or becomes absurd. Extremes make invisible structural flaws visible because they strip away the moderate middle where everything vaguely works.
**It fails when:** the extremes are unreachable in practice and you over-engineer for them. Distinguish "breaks at infinity" from "breaks at realistic maximum."

### 7. Change of representation
**Reach for it when:** stuck after honest attempts; the problem feels like wading through mud.
**Run it:** translate the problem into a different form — table ↔ diagram ↔ equation ↔ plain-language story ↔ physical analogy ↔ code. Each representation makes different structure salient and different operations cheap. Many famous "hard" problems were only hard in one notation.
**It fails when:** translation loses a constraint. After solving in the new representation, translate the answer back and re-check it against the original.

### 8. Analogy transfer (with disanalogy audit)
**Reach for it when:** the problem resembles a solved problem in another domain.
**Run it:** map the *structure*, not the surface — which entities, relations, and constraints correspond? Import the solution pattern. Then run the mandatory disanalogy audit: list where the mapping breaks and check whether any break is load-bearing.
**It fails when:** the audit is skipped. Surface similarity with structural difference is the signature of seductive wrong answers.

---

## B. Inference & evidence

### 9. The inference triad — knowing which logic you're using
**Reach for it when:** always; this is background awareness, not an occasional tool.
**Run it:** name the move you are making. **Deduction** (rules → certain conclusions): valid for math, logic, spec compliance; conclusions inherit certainty only if premises are certain. **Induction** (instances → pattern): conclusions are probabilistic; strength scales with sample size and diversity — say how many instances and how varied. **Abduction** (observation → best explanation): the weakest and most-used; treat every abductive conclusion as a hypothesis awaiting test, never as a finding.
**It fails when:** an abductive guess gets promoted to deductive certainty in your own head — the most common silent inference error.

### 10. Multiple hypotheses + strong inference
**Reach for it when:** explaining anything — a bug, a data pattern, a user behavior, a system failure.
**Run it:** generate at least three genuinely distinct hypotheses before evaluating any (including a boring one: coincidence, measurement error, "it was always like this"). Then design the *discriminating* test — the observation that comes out differently depending on which hypothesis is true. Run cheapest-most-discriminating first. One discriminating test outweighs ten confirmations.
**It fails when:** the hypotheses are cosmetic variants of one idea, or the "test" would pass under all of them (confirmation dressed as testing).

### 11. Informal Bayesian updating
**Reach for it when:** integrating new evidence into an existing belief.
**Run it:** state your prior and why. For each piece of evidence ask the only question that matters: *"how surprising would this evidence be if my belief were wrong?"* Unsurprising-either-way evidence updates nothing, no matter how consistent it feels. Move your confidence proportionally to genuine surprise, and say the new level out loud.
**It fails when:** the prior is invisible to you (see anchoring) or you count the same underlying evidence multiple times because it arrived in different packaging.

### 12. Outside view / base rates
**Reach for it when:** forecasting anything — durations, costs, success odds, effect sizes.
**Run it:** before reasoning from the specifics of *this* case, find its reference class: what happened, on average, to broadly similar attempts? Anchor there. Then adjust for the ways this case genuinely differs — with evidence for each adjustment, since "we're different" is what every member of the reference class believed.
**It fails when:** the reference class is chosen after the fact to flatter the conclusion. Pick the class before looking at its statistics.

### 13. Fermi estimation
**Reach for it when:** you need a quantity you cannot look up, or a sanity check on a quantity you can.
**Run it:** factor the unknown into components you can bound (per-unit × units × frequency...). Estimate each with a plausible range, not a point. Multiply through for lower and upper brackets. Getting within an order of magnitude is the goal and is usually enough to make the decision.
**It fails when:** one factor carries hidden order-of-magnitude uncertainty that the neat arithmetic launders into false precision. Flag the dominant uncertainty explicitly.

### 14. Counterfactual probe
**Reach for it when:** any causal claim — "X caused Y," "the fix worked," "the campaign drove sales."
**Run it:** ask "would Y have happened without X?" Hunt for the comparison that approximates the counterfactual: control group, before/after with stable conditions, dose-response, the times X was present without Y. Correlation plus a satisfying story is not causation; it is a hypothesis (see #10).
**It fails when:** confounders drive both X and Y, or the effect direction is reversed. List candidate confounders before accepting any causal story.

---

## C. Foresight & judgment

### 15. Second-order and systems thinking
**Reach for it when:** proposing any intervention in a system containing people, incentives, or feedback.
**Run it:** ask "and then what?" at least twice. Trace: who adapts their behavior in response? What feedback loops amplify or dampen the effect? Where does the new equilibrium settle — which is often far from the first-order effect? Most bad policies and bad designs are first-order reasoning applied to second-order systems.
**It fails when:** speculation cascades — each "then what" is less certain than the last. Weight second-order predictions by their compounding uncertainty.

### 16. Constraint relaxation
**Reach for it when:** the constrained problem seems impossible or all options seem bad.
**Run it:** delete constraints one at a time and solve the easier problem. Then reintroduce each constraint and see exactly what it destroys. This reveals *which* constraint is binding (often only one is), whether it is real or assumed, and sometimes a path that satisfies it differently than assumed.
**It fails when:** you fall in love with the relaxed solution and quietly stop treating the real constraint as real.

### 17. Steelmanning
**Reach for it when:** rejecting a position, design, or approach — especially one you find annoying.
**Run it:** construct the *strongest* version of the opposing view, better than its proponents state it. Argue for it sincerely for a moment. Only reject after your best version fails. What survives steelmanning is a decision; what skips it is a prejudice.
**It fails when:** performed as ritual — a weak summary followed by the rejection you'd already written.

### 18. Premortem
**Reach for it when:** committing to any high-stakes plan.
**Run it:** jump forward in time — the project has failed, definitively. Write the story of why, specifically and without hedging. The narrative frame ("it failed because...") surfaces risks that the checklist frame ("what could go wrong?") reliably misses. Then add mitigations or tripwires for the top causes.
**It fails when:** the failure story is generic ("we ran out of time"). Force named, mechanistic causes.

### 19. Diverge-then-converge
**Reach for it when:** any generative task — options, designs, hypotheses, names, plans.
**Run it:** two strictly separated passes. **Diverge:** produce a quantity quota (5–10 minimum) with judgment suspended; deliberately include one weird or "wrong" option — it stretches the space the sensible options land in. **Converge:** only now define explicit selection criteria, then score. Mixing the passes lets premature judgment kill the best option before it fully exists.
**It fails when:** the quota is met with cosmetic variants. Force genuine distance between options: different mechanisms, not different adjectives.

### 20. Satisficing gate — the stopping rule
**Reach for it when:** starting anything, so you know when to stop.
**Run it:** define "good enough" *before* working — the threshold at which additional effort stops changing the decision or materially improving the deliverable. When reached: stop, unless the stakes (Effort Dial: High) explicitly justify optimizing. Effort past the gate is usually spent polishing what no one will notice while real work waits.
**It fails when:** the gate is set by fatigue rather than upfront, or applied to high-stakes work where the last 10% is the point.

---

## Combinations that earn their keep

- **Stuck:** #7 change representation → #5 toy model → #6 extremes → #2 inversion, in that order.
- **Explaining anything:** #10 multiple hypotheses, tested via #14 counterfactual probes, updated via #11.
- **Estimating anything:** #12 base rate first, #13 Fermi to adjust, dominant uncertainty flagged.
- **High-stakes commit:** #17 steelman the alternative → #18 premortem the choice → #15 trace second-order effects.
- **Anything novel:** #19 diverge-converge for options → #1 first principles on the winner → #20 gate to ship.
