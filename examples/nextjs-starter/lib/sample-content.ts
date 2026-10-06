/** Starting document for the full editor demo. */
export const FULL_EDITOR_CONTENT = `
<h1>Welcome to slash-editor</h1>
<p>A Notion-style block editor for React. Type <code>/</code> on an empty line to insert any block, select text for the formatting toolbar, or grab the handle on the left to drag blocks around.</p>
<h2>Text blocks</h2>
<ul>
  <li><p>Markdown shortcuts: <code># </code>, <code>- </code>, <code>1. </code>, <code>[] </code>, <code>" </code>, <code>&gt; </code></p></li>
  <li><p><strong>Bold</strong>, <em>italic</em>, <s>strike</s>, <code>inline code</code>, and <a href="https://slasheditor.dev">links</a></p></li>
</ul>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Install the kit from the shadcn registry</p></li>
  <li data-type="taskItem" data-checked="false"><p>Swap the route handlers in <code>app/api</code> for your own backend</p></li>
</ul>
<div data-type="callout" data-icon="💡"><p>Callouts wrap block content in a highlighted aside.</p></div>
<details>
  <summary>Toggle lists collapse content</summary>
  <div data-type="detailsContent"><p>Type <code>&gt; </code> or <code>/toggle</code> to insert one.</p></div>
</details>
<blockquote><p>Every UI piece is source code in <code>components/</code>. You own it.</p></blockquote>
<pre><code class="language-ts">const editor = useSlashEditor({ blockKit: { headingLevels: [1, 2, 3] } })</code></pre>
<h2>Diagrams, media &amp; layout</h2>
<pre data-type="mermaid"><code>flowchart LR
    A[Type /mermaid] --> B{Caret inside?}
    B -->|yes| C[Edit source]
    B -->|no| D[Rendered diagram]</code></pre>
<div data-type="image" data-src="/sample.svg" data-status="ready"><img src="/sample.svg" alt="Abstract gradient with a slash" /></div>
<a data-type="embed" data-mode="bookmark" href="https://tiptap.dev" data-title="Tiptap" data-description="The headless editor framework slash-editor builds on.">Tiptap</a>
<div data-type="columns">
  <div data-type="column"><p>Columns place content side by side.</p></div>
  <div data-type="column"><p>Type <code>/columns</code> to insert a new layout.</p></div>
</div>
<table>
  <tbody>
    <tr><th><p>Block</p></th><th><p>Adapter</p></th></tr>
    <tr><td><p>Image / File / Video</p></td><td><p>UploadAdapter</p></td></tr>
    <tr><td><p>AI block</p></td><td><p>StreamAdapter</p></td></tr>
  </tbody>
</table>
<h2>Mentions, comments &amp; AI</h2>
<p>Type <code>@</code> to mention a teammate: thanks <span data-type="mention" data-id="1">@Ada Lovelace</span>. Type <code>:</code> for emoji <span data-type="emoji" data-name="rocket"></span>.</p>
<p>Select text and use the comment button in the toolbar to open a thread.</p>
<p>Type <code>/continue-writing</code> or <code>/summarize</code> to stream a streamed AI response.</p>
`;
