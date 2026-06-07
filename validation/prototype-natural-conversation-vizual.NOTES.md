# Prototype Notes

Question: what should a natural-conversation Vizual integration and cold-start acceptance flow feel like before changing runtime code?

Variants:

- `A`: chat message parts with an inline interactive Vizual block.
- `B`: clean-agent browser acceptance runner shape, using a gradient-descent learning-rate playground as an interaction that requires no external business API.
- `C`: SDK/runtime integration package and Catalog Gap Sink shape.

Early correction: interactions must be backed by user-provided intent/data or an explicit host capability. The prototype previously showed "dispatch to ops"; that was replaced with a local concept playground because no dispatch API was provided.

Second correction: do not add an action just to prove action-loop plumbing. The playground no longer has a "return parameters to Agent" button; sliders are useful because they change the local explanation. Current state should go back to the Agent only when the user naturally asks a follow-up.

Verdict placeholder: choose useful pieces, then delete this prototype or absorb the decision into real docs/runtime.
