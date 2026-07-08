# Playbooks — mode-specific procedure

The Loop (SKILL.md) is universal; these playbooks specialize EXECUTE and VERIFY for the four fundamental modes of cognitive work. First classify the task — many tasks chain modes (ANALYZE feeds DECIDE; SOLVE contains ANALYZE). Run the playbook for the mode you are currently in.

| Mode | The task is to... | Core question |
|---|---|---|
| **ANALYZE** | understand something that exists | "What is true here, and why?" |
| **SOLVE** | move from a broken/current state to a goal state | "What closes the gap?" |
| **CREATE** | bring something new into existence | "What should exist, and is it good?" |
| **DECIDE** | commit to one option among several | "Which choice, given what we know?" |

---

## ANALYZE

1. **Define the question precisely.** "Analyze the data" is not a question. "Did retention change after the March release, and by how much?" is. A vague question guarantees a vague answer that pleases no one.
2. **Inventory the evidence** — what exists, its provenance, its known gaps and biases. Note what evidence is *missing* that you would expect to exist; absence is information.
3. **Separate observation from interpretation — physically.** Two lists. "Latency rose 40% on Tuesdays" is observation. "The batch job causes it" is interpretation. Interpretations masquerading as observations are how analyses go confidently wrong.
4. **Build an issue tree** for the question: break it into sub-questions that are collectively exhaustive and mutually exclusive. Every sub-question gets an answer or an explicit "unknown."
5. **Quantify with confidence attached.** Prefer numbers with ranges to adjectives. "Roughly 2–3× baseline, low confidence" beats "significantly higher."
6. **Triangulate key claims.** Any conclusion that matters needs two *independent* lines of evidence — independent meaning different failure modes, not two reports quoting the same source.
7. **Synthesize the so-what.** An analysis ends with what the findings mean for the decision or action at hand, not with a pile of findings.

**Mode-specific VERIFY:** Trace every conclusion backward to specific evidence — any orphan conclusions? For the headline finding, name the strongest *alternative* explanation and say why the evidence disfavors it (toolbox #10, #14). Check for survivorship: does the dataset only contain the cases that made it far enough to be recorded?

---

## SOLVE

1. **Write the problem statement:** givens, goal state, hard constraints, unknowns. A precise statement is often half the solution; an imprecise one guarantees solving the wrong problem.
2. **Reproduce / confirm the problem is real.** Before fixing, observe the failure yourself. Problems reported secondhand are hypotheses about problems.
3. **Generate ≥3 hypotheses** about the cause or the path — including a boring one (typo, config, misread requirement). The first hypothesis is a suspect, not a verdict (toolbox #10).
4. **Test in discriminating order:** cheapest test that best separates the live hypotheses goes first. Bisect to localize (toolbox #4): which half of the pipeline/timeline/codepath contains it?
5. **Drive to root cause, not symptom.** Chain "why?" downward — each answer supported by evidence, not narrative — until you reach a cause whose fixing prevents the whole class of problem, not just this instance.
6. **Fix minimally at the root.** A fix at the symptom level is a debt with interest.
7. **Verify the fix three ways:** the original failure no longer reproduces; nothing adjacent broke (regression); and ask "what would have caught this earlier?" — add that guard if cheap.

**Mode-specific VERIFY:** Can you *cause* the problem to return by reverting the fix? If not, you may have fixed a coincidence. Does the explanation account for **all** observed symptoms, including the weird one you set aside? An explanation that ignores one symptom is usually wrong, not almost-right.

---

## CREATE

1. **Study exemplars first.** Before making anything, examine 3–5 excellent instances of the form. Extract *principles* (why they work), not surface features (what they look like). You cannot reliably hit a quality bar you have not calibrated against — this step is what "taste" is made of.
2. **List the constraints and treat them as generators.** Format, length, audience, budget, brand, deadline. Constraints are not obstacles to creativity; they are what give the search direction. Unconstrained creation produces mush.
3. **Diverge hard** (toolbox #19): 5–10 genuinely distinct directions, judgment suspended, one deliberately weird. Distinct means different *mechanisms* — a different structure, angle, or premise — not the same idea in new clothes.
4. **Converge with pre-declared criteria.** Write the selection criteria (from FRAME's goal + the exemplar principles) *before* scoring options, or the criteria will quietly reshape themselves to crown your favorite.
5. **Prototype the cheapest testable slice** of the winner — outline before essay, sketch before render, stub before system. The prototype's job is to make the weakest aspect fail early and cheaply.
6. **Iterate against feedback,** real or simulated: walk through the piece as its intended audience, first-time, cold. Where do they get confused, bored, or lost?
7. **Edit ruthlessly.** Cutting is where quality concentrates. Every element must earn its place against the question "does removing this make it worse?" — kill anything that survives only because you like it (darlings included).

**Mode-specific VERIFY:** Side-by-side taste check against the exemplars from step 1 — does it belong in their company, and if not, what is the *specific* gap? Fresh-eyes walkthrough of the first 10 seconds of audience experience. Confirm the piece does the job from FRAME, not the more impressive job it drifted toward.

---

## DECIDE

1. **Classify reversibility first.** A two-way door (cheap to undo) should be decided fast with ~70% of the information you wish you had — deliberation past that point costs more than the occasional wrong call. A one-way door (expensive/impossible to undo) gets the full rigor below. Misclassifying which door you are at is the most expensive mistake in this playbook.
2. **Assemble real options,** always including **"do nothing / status quo"** and at least one **hybrid**. A decision with one option is not a decision; a decision without the status quo hides its true baseline.
3. **Set criteria and weights before scoring.** Deciding what matters *after* seeing how options score is rationalization with a spreadsheet.
4. **Estimate consequences as ranges, not points** (toolbox #12, #13): base rate first, then case-specific adjustment, with the dominant uncertainty named per option.
5. **Premortem the leading option** (toolbox #18) and **steelman the runner-up** (toolbox #17). If the leader survives its own failure story and the runner-up's best case, commit.
6. **Decide, and journal it:** record the choice, the reasoning, the key assumptions, and — critically — the tripwire conditions that would trigger a revisit. The journal converts future outcomes into calibration data instead of hindsight bias.
7. **Commit fully.** A decision half-executed while re-litigating alternatives gets the costs of both options and the benefits of neither.

**Mode-specific VERIFY:** Is this an actual choice or a hidden default wearing analysis as costume? Whose incentives shaped the criteria list — and would the ranking survive criteria set by the person who bears the downside? Would you make the same call if the options' labels were swapped and only the consequence ranges remained?
