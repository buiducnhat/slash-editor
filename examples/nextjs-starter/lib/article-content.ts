/** The published article shown on `/read-only`, as editor HTML. */
export const ARTICLE_TITLE = "Designing a block editor you can own";

export const ARTICLE_CONTENT = `
<h1>${ARTICLE_TITLE}</h1>
<p>Most editors ship as a dependency you configure. slash-editor ships as a core you extend and an interface you copy into your repository. This article walks through why that split exists and what it costs you in practice.</p>
<div data-type="image" data-src="/sample.svg" data-status="ready"><img src="/sample.svg" alt="Abstract gradient with a slash" /></div>
<h2>A schema that stays flat</h2>
<p>Every block is a sibling of every other block. Nesting comes from container nodes such as lists, callouts and toggles, never from a universal wrapper. That keeps drag and drop, block ids and <a href="https://tiptap.dev/docs/editor/introduction">Tiptap</a> commands predictable: a block is a node at depth one, whatever it contains.</p>
<div data-type="callout" data-icon="💡"><p>Because the schema is flat, a block handle only has to answer one question: which top-level node is under the pointer?</p></div>
<h2>Interfaces are source code</h2>
<p>The slash menu, bubble toolbar and node views are components in your own project. Changing how a menu looks is an edit, not a fork. The only contract with the core is the data it exposes:</p>
<pre><code class="language-tsx">const editor = useSlashEditor({
  content,
  blockKit: { ai: { adapter: streamAdapter } },
});

return &lt;EditorContent editor={editor} /&gt;;</code></pre>
<h2>Adapters, not integrations</h2>
<p>Anything that needs a backend goes through a small adapter you provide. The core never talks to a network on its own.</p>
<table>
  <tbody>
    <tr><th><p>Capability</p></th><th><p>You provide</p></th><th><p>Core handles</p></th></tr>
    <tr><td><p>Images, files, video</p></td><td><p>An <code>UploadAdapter</code></p></td><td><p>Progress, errors, retry</p></td></tr>
    <tr><td><p>AI writing</p></td><td><p>A <code>StreamAdapter</code></p></td><td><p>Streaming, keep, discard</p></td></tr>
    <tr><td><p>Comments</p></td><td><p>A <code>CommentThreadStore</code></p></td><td><p>Anchors that follow edits</p></td></tr>
  </tbody>
</table>
<h2>How a request flows</h2>
<pre data-type="mermaid"><code>flowchart LR
    A[User action] --> B[Core command]
    B --> C{Adapter}
    C -->|stream| D[AI block]
    C -->|upload| E[Media node]
    D --> F[Document]
    E --> F</code></pre>
<blockquote><p>Choose the boring design: a small core, explicit adapters and components you can read in one sitting.</p></blockquote>
<h2>Before you adopt it</h2>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><p>Read the schema and decide which blocks you need</p></li>
  <li data-type="taskItem" data-checked="true"><p>Install the interface components into your repository</p></li>
  <li data-type="taskItem" data-checked="false"><p>Replace the mock adapters with your own backend</p></li>
  <li data-type="taskItem" data-checked="false"><p>Decide how published documents are rendered</p></li>
</ul>
<details>
  <summary>Why not render published pages with the editor?</summary>
  <div data-type="detailsContent"><p>You can. A read-only editor is a viewer: links navigate, toggles open and diagrams render, while menus and handles stand down. If you only need static output, <code>getHTML()</code> on the server is cheaper.</p></div>
</details>
<h2>Where to go next</h2>
<p>Try the <a href="/editor">full editor</a> to see every block, or switch this page to edit mode and change the article yourself. Nothing you type here is saved.</p>
`;
