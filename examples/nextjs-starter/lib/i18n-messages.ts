import type { SlashEditorMessages } from "@slash-editor/core";

/**
 * One `SlashEditorMessages` per locale. Every id below is an item `id` from
 * the core defaults: `defaultSlashItems` and `defaultBlockTypes` (slash,
 * bubble and block menus), `defaultAiActions`, and the pages items.
 *
 * Aliases and keywords *replace* the English ones, so each list keeps the
 * English shorthand (`/h1`, `/ul`, `/todo`...) next to the local words, plus an
 * accent-free spelling where the language has accents. Keywords that are only
 * Markdown symbols (`#`, `-`, `1.`, `[]`, `---`) are left out so they keep
 * working. English is the library default, so it needs no messages.
 */

const vi: SlashEditorMessages = {
  hint: "Gõ để tìm kiếm",
  groups: {
    "Basic blocks": "Khối cơ bản",
    "Advanced blocks": "Khối nâng cao",
    Media: "Phương tiện",
    Structure: "Cấu trúc",
    Inline: "Nội tuyến",
    AI: "Trợ lý AI",
    Pages: "Trang",
  },
  items: {
    paragraph: {
      title: "Văn bản",
      description: "Đoạn văn thường",
      aliases: ["paragraph", "plain", "van ban", "doan van"],
    },
    "heading-1": {
      title: "Tiêu đề 1",
      description: "Tiêu đề phần lớn",
      aliases: ["h1", "title", "tieu de"],
    },
    "heading-2": {
      title: "Tiêu đề 2",
      description: "Tiêu đề phần vừa",
      aliases: ["h2", "subtitle", "tieu de phu"],
    },
    "heading-3": { title: "Tiêu đề 3", description: "Tiêu đề phần nhỏ", aliases: ["h3"] },
    "bullet-list": {
      title: "Danh sách dấu đầu dòng",
      description: "Danh sách không thứ tự",
      aliases: ["ul", "bullet", "danh sach"],
    },
    "ordered-list": {
      title: "Danh sách đánh số",
      description: "Danh sách có thứ tự",
      aliases: ["ol", "numbered", "danh sach so"],
    },
    "task-list": {
      title: "Danh sách việc cần làm",
      description: "Danh sách kiểm có hộp chọn",
      aliases: ["todo", "checklist", "checkbox", "viec can lam"],
    },
    blockquote: {
      title: "Trích dẫn",
      description: "Ghi lại một câu trích dẫn",
      aliases: ["quote", "citation", "trich dan"],
    },
    callout: {
      title: "Chú thích nổi bật",
      description: "Ghi chú được làm nổi bật",
      aliases: ["note", "info", "tip", "ghi chu"],
    },
    toggle: {
      title: "Danh sách thu gọn",
      description: "Nội dung có thể thu gọn",
      aliases: ["details", "collapse", "dropdown", "thu gon"],
    },
    "code-block": {
      title: "Khối mã",
      description: "Mã nguồn phông đơn cách",
      aliases: ["code", "snippet", "ma"],
    },
    "toggle-heading-1": {
      title: "Tiêu đề thu gọn 1",
      description: "Tiêu đề lớn có thể thu gọn",
      aliases: ["th1", "toggleheading1"],
    },
    "toggle-heading-2": {
      title: "Tiêu đề thu gọn 2",
      description: "Tiêu đề vừa có thể thu gọn",
      aliases: ["th2", "toggleheading2"],
    },
    "toggle-heading-3": {
      title: "Tiêu đề thu gọn 3",
      description: "Tiêu đề nhỏ có thể thu gọn",
      aliases: ["th3", "toggleheading3"],
    },
    mermaid: {
      title: "Sơ đồ Mermaid",
      description: "Lưu đồ, sơ đồ tuần tự và hơn thế nữa",
      aliases: ["diagram", "flowchart", "chart", "graph", "so do"],
    },
    "horizontal-rule": {
      title: "Đường kẻ ngang",
      description: "Dải phân cách trực quan",
      aliases: ["divider", "hr", "rule", "duong ke"],
    },
    image: {
      title: "Hình ảnh",
      description: "Tải lên hoặc nhúng hình ảnh",
      aliases: ["image", "picture", "photo", "anh", "hinh anh"],
    },
    file: {
      title: "Tệp",
      description: "Tải lên hoặc đính kèm tệp",
      aliases: ["file", "attachment", "upload", "tep", "dinh kem"],
    },
    video: {
      title: "Video",
      description: "Tải lên hoặc nhúng video",
      aliases: ["video", "movie", "phim"],
    },
    embed: {
      title: "Nhúng liên kết",
      description: "Đánh dấu hoặc nhúng iframe từ liên kết",
      aliases: ["embed", "bookmark", "link", "iframe", "nhung"],
    },
    table: {
      title: "Bảng",
      description: "Các ô theo hàng và cột",
      aliases: ["table", "grid", "bang"],
    },
    columns: {
      title: "Cột",
      description: "Bố cục song song",
      aliases: ["columns", "layout", "cot", "bo cuc"],
    },
    emoji: {
      title: "Biểu tượng cảm xúc",
      description: "Tìm và chèn emoji",
      aliases: ["emoji", "emoticon", "smiley", "cam xuc"],
    },
    page: {
      title: "Trang con",
      description: "Tạo trang con trong trang này",
      aliases: ["page", "subpage", "trang"],
    },
    "link-to-page": {
      title: "Liên kết trang",
      description: "Liên kết tới một trang có sẵn",
      aliases: ["link", "page link", "lien ket"],
    },
    "continue-writing": {
      title: "Viết tiếp",
      description: "AI viết tiếp phần văn bản phía trên con trỏ",
      aliases: ["continue", "viet tiep"],
    },
    summarize: {
      title: "Tóm tắt",
      description: "Tóm tắt văn bản nguồn",
      aliases: ["summarize", "tom tat"],
    },
    "brainstorm-ideas": {
      title: "Gợi ý ý tưởng",
      description: "Liệt kê các ý tưởng liên quan đến văn bản",
      aliases: ["brainstorm", "ideas", "y tuong"],
    },
    "improve-writing": {
      title: "Cải thiện văn phong",
      description: "Viết lại cho rõ ràng và mạch lạc",
      aliases: ["improve", "cai thien"],
    },
    "fix-spelling-grammar": {
      title: "Sửa chính tả và ngữ pháp",
      description: "Sửa lỗi mà không đổi ý nghĩa",
      aliases: ["fix", "spelling", "grammar", "chinh ta"],
    },
    "make-shorter": {
      title: "Rút gọn",
      description: "Viết lại ngắn gọn hơn",
      aliases: ["shorter", "rut gon"],
    },
    "make-longer": {
      title: "Mở rộng",
      description: "Bổ sung chi tiết hữu ích",
      aliases: ["longer", "mo rong"],
    },
  },
  placeholder: {
    paragraph: "Nhấn '/' để chọn lệnh…",
    heading1: "Tiêu đề 1",
    heading2: "Tiêu đề 2",
    heading3: "Tiêu đề 3",
    listItem: "Danh sách",
    taskItem: "Việc cần làm",
    blockquote: "Trích dẫn",
    callout: "Chú thích",
    details: "Thu gọn",
    toggleHeading1: "Tiêu đề thu gọn 1",
    toggleHeading2: "Tiêu đề thu gọn 2",
    toggleHeading3: "Tiêu đề thu gọn 3",
  },
  blockMenu: { duplicate: "Nhân bản", delete: "Xóa" },
  bubbleToolbar: {
    bold: "In đậm",
    italic: "In nghiêng",
    strike: "Gạch ngang",
    code: "Mã",
    link: "Liên kết",
  },
  untitledPage: "Không có tiêu đề",
  uploadFailed: "Tải lên thất bại",
};

const fr: SlashEditorMessages = {
  hint: "Tapez pour rechercher",
  groups: {
    "Basic blocks": "Blocs de base",
    "Advanced blocks": "Blocs avancés",
    Media: "Médias",
    Structure: "Structure",
    Inline: "En ligne",
    AI: "IA",
    Pages: "Pages",
  },
  items: {
    paragraph: {
      title: "Texte",
      description: "Paragraphe simple",
      aliases: ["paragraph", "plain", "paragraphe", "texte"],
    },
    "heading-1": {
      title: "Titre 1",
      description: "Grand titre de section",
      aliases: ["h1", "title", "titre"],
    },
    "heading-2": {
      title: "Titre 2",
      description: "Titre de section moyen",
      aliases: ["h2", "subtitle", "sous-titre"],
    },
    "heading-3": { title: "Titre 3", description: "Petit titre de section", aliases: ["h3"] },
    "bullet-list": {
      title: "Liste à puces",
      description: "Liste non ordonnée",
      aliases: ["ul", "bullet", "puces", "liste"],
    },
    "ordered-list": {
      title: "Liste numérotée",
      description: "Liste ordonnée",
      aliases: ["ol", "numbered", "numerotee"],
    },
    "task-list": {
      title: "Liste de tâches",
      description: "Liste de contrôle avec cases à cocher",
      aliases: ["todo", "checklist", "checkbox", "taches", "a faire"],
    },
    blockquote: {
      title: "Citation",
      description: "Insérer une citation",
      aliases: ["quote", "citation"],
    },
    callout: {
      title: "Encadré",
      description: "Remarque mise en évidence",
      aliases: ["note", "info", "tip", "astuce", "encadre"],
    },
    toggle: {
      title: "Liste dépliante",
      description: "Contenu repliable",
      aliases: ["details", "collapse", "dropdown", "deplier", "replier"],
    },
    "code-block": {
      title: "Bloc de code",
      description: "Code à chasse fixe",
      aliases: ["code", "snippet", "extrait"],
    },
    "toggle-heading-1": {
      title: "Titre dépliant 1",
      description: "Grand titre repliable",
      aliases: ["th1", "toggleheading1"],
    },
    "toggle-heading-2": {
      title: "Titre dépliant 2",
      description: "Titre moyen repliable",
      aliases: ["th2", "toggleheading2"],
    },
    "toggle-heading-3": {
      title: "Titre dépliant 3",
      description: "Petit titre repliable",
      aliases: ["th3", "toggleheading3"],
    },
    mermaid: {
      title: "Diagramme Mermaid",
      description: "Organigrammes, séquences et plus encore",
      aliases: ["diagram", "flowchart", "chart", "graph", "diagramme", "schema"],
    },
    "horizontal-rule": {
      title: "Séparateur",
      description: "Ligne de séparation visuelle",
      aliases: ["divider", "hr", "rule", "separateur", "ligne"],
    },
    image: {
      title: "Image",
      description: "Importer ou intégrer une image",
      aliases: ["image", "picture", "photo"],
    },
    file: {
      title: "Fichier",
      description: "Importer ou joindre un fichier",
      aliases: ["file", "attachment", "upload", "fichier", "piece jointe"],
    },
    video: {
      title: "Vidéo",
      description: "Importer ou intégrer une vidéo",
      aliases: ["video", "movie", "film"],
    },
    embed: {
      title: "Intégration",
      description: "Marque-page ou iframe depuis un lien",
      aliases: ["embed", "bookmark", "link", "iframe", "integrer", "lien"],
    },
    table: {
      title: "Tableau",
      description: "Lignes et colonnes de cellules",
      aliases: ["table", "grid", "tableau"],
    },
    columns: {
      title: "Colonnes",
      description: "Mise en page côte à côte",
      aliases: ["columns", "layout", "colonnes", "mise en page"],
    },
    emoji: {
      title: "Émoji",
      description: "Rechercher et insérer un émoji",
      aliases: ["emoji", "emoticon", "smiley", "emoticone"],
    },
    page: {
      title: "Page",
      description: "Créer une sous-page dans cette page",
      aliases: ["page", "subpage", "sous-page"],
    },
    "link-to-page": {
      title: "Lien vers une page",
      description: "Lier une page existante",
      aliases: ["link", "page link", "lien"],
    },
    "continue-writing": {
      title: "Continuer à écrire",
      description: "L'IA prolonge le texte au-dessus du curseur",
      aliases: ["continue", "continuer"],
    },
    summarize: {
      title: "Résumer",
      description: "Résumer le texte source",
      aliases: ["summarize", "resumer"],
    },
    "brainstorm-ideas": {
      title: "Trouver des idées",
      description: "Lister des idées liées au texte",
      aliases: ["brainstorm", "ideas", "idees"],
    },
    "improve-writing": {
      title: "Améliorer l'écriture",
      description: "Réécrire pour plus de clarté et de fluidité",
      aliases: ["improve", "ameliorer"],
    },
    "fix-spelling-grammar": {
      title: "Corriger l'orthographe et la grammaire",
      description: "Corriger les fautes sans changer le sens",
      aliases: ["fix", "spelling", "grammar", "orthographe", "grammaire"],
    },
    "make-shorter": {
      title: "Raccourcir",
      description: "Réécrire de façon plus concise",
      aliases: ["shorter", "court"],
    },
    "make-longer": {
      title: "Allonger",
      description: "Développer avec des détails utiles",
      aliases: ["longer", "long"],
    },
  },
  placeholder: {
    paragraph: "Tapez '/' pour les commandes…",
    heading1: "Titre 1",
    heading2: "Titre 2",
    heading3: "Titre 3",
    listItem: "Liste",
    taskItem: "À faire",
    blockquote: "Citation",
    callout: "Encadré",
    details: "Section dépliante",
    toggleHeading1: "Titre dépliant 1",
    toggleHeading2: "Titre dépliant 2",
    toggleHeading3: "Titre dépliant 3",
  },
  blockMenu: { duplicate: "Dupliquer", delete: "Supprimer" },
  bubbleToolbar: {
    bold: "Gras",
    italic: "Italique",
    strike: "Barré",
    code: "Code",
    link: "Lien",
  },
  untitledPage: "Sans titre",
  uploadFailed: "Échec de l'envoi",
};

const ja: SlashEditorMessages = {
  hint: "入力して検索",
  groups: {
    "Basic blocks": "基本ブロック",
    "Advanced blocks": "高度なブロック",
    Media: "メディア",
    Structure: "構造",
    Inline: "インライン",
    AI: "AI",
    Pages: "ページ",
  },
  items: {
    paragraph: {
      title: "テキスト",
      description: "通常の段落",
      aliases: ["paragraph", "plain", "テキスト", "段落"],
    },
    "heading-1": {
      title: "見出し1",
      description: "大きなセクション見出し",
      aliases: ["h1", "title", "見出し"],
    },
    "heading-2": {
      title: "見出し2",
      description: "中くらいのセクション見出し",
      aliases: ["h2", "subtitle", "小見出し"],
    },
    "heading-3": { title: "見出し3", description: "小さなセクション見出し", aliases: ["h3"] },
    "bullet-list": {
      title: "箇条書きリスト",
      description: "順序なしのリスト",
      aliases: ["ul", "bullet", "箇条書き"],
    },
    "ordered-list": {
      title: "番号付きリスト",
      description: "順序ありのリスト",
      aliases: ["ol", "numbered", "番号"],
    },
    "task-list": {
      title: "ToDoリスト",
      description: "チェックボックス付きのリスト",
      aliases: ["todo", "checklist", "checkbox", "チェックリスト"],
    },
    blockquote: {
      title: "引用",
      description: "引用文を追加",
      aliases: ["quote", "citation", "いんよう"],
    },
    callout: {
      title: "コールアウト",
      description: "目立たせる補足",
      aliases: ["note", "info", "tip", "メモ"],
    },
    toggle: {
      title: "トグルリスト",
      description: "折りたたみ可能なコンテンツ",
      aliases: ["details", "collapse", "dropdown", "トグル", "折りたたみ"],
    },
    "code-block": {
      title: "コードブロック",
      description: "等幅フォントのコード",
      aliases: ["code", "snippet", "コード"],
    },
    "toggle-heading-1": {
      title: "トグル見出し1",
      description: "折りたたみ可能な大見出し",
      aliases: ["th1", "toggleheading1"],
    },
    "toggle-heading-2": {
      title: "トグル見出し2",
      description: "折りたたみ可能な中見出し",
      aliases: ["th2", "toggleheading2"],
    },
    "toggle-heading-3": {
      title: "トグル見出し3",
      description: "折りたたみ可能な小見出し",
      aliases: ["th3", "toggleheading3"],
    },
    mermaid: {
      title: "Mermaid図",
      description: "フローチャートやシーケンス図など",
      aliases: ["diagram", "flowchart", "chart", "graph", "図", "フローチャート"],
    },
    "horizontal-rule": {
      title: "区切り線",
      description: "視覚的な区切り",
      aliases: ["divider", "hr", "rule", "区切り"],
    },
    image: {
      title: "画像",
      description: "画像をアップロードまたは埋め込み",
      aliases: ["image", "picture", "photo", "画像", "写真"],
    },
    file: {
      title: "ファイル",
      description: "ファイルをアップロードまたは添付",
      aliases: ["file", "attachment", "upload", "ファイル", "添付"],
    },
    video: {
      title: "動画",
      description: "動画をアップロードまたは埋め込み",
      aliases: ["video", "movie", "動画"],
    },
    embed: {
      title: "埋め込み",
      description: "ブックマークやiframeでリンクを表示",
      aliases: ["embed", "bookmark", "link", "iframe", "埋め込み", "リンク"],
    },
    table: {
      title: "テーブル",
      description: "行と列で構成されるセル",
      aliases: ["table", "grid", "テーブル", "表"],
    },
    columns: {
      title: "列",
      description: "横並びのレイアウト",
      aliases: ["columns", "layout", "列", "レイアウト"],
    },
    emoji: {
      title: "絵文字",
      description: "絵文字を検索して挿入",
      aliases: ["emoji", "emoticon", "smiley", "絵文字"],
    },
    page: {
      title: "ページ",
      description: "このページ内にサブページを作成",
      aliases: ["page", "subpage", "ページ"],
    },
    "link-to-page": {
      title: "ページへのリンク",
      description: "既存のページにリンク",
      aliases: ["link", "page link", "リンク"],
    },
    "continue-writing": {
      title: "続きを書く",
      description: "カーソルより上の文章の続きをAIが書きます",
      aliases: ["continue", "続き"],
    },
    summarize: {
      title: "要約",
      description: "元の文章を要約します",
      aliases: ["summarize", "要約"],
    },
    "brainstorm-ideas": {
      title: "アイデアを出す",
      description: "文章に関連するアイデアを挙げます",
      aliases: ["brainstorm", "ideas", "アイデア"],
    },
    "improve-writing": {
      title: "文章を改善",
      description: "わかりやすく読みやすい文章に書き直します",
      aliases: ["improve", "改善"],
    },
    "fix-spelling-grammar": {
      title: "誤字脱字を修正",
      description: "意味を変えずに誤りを直します",
      aliases: ["fix", "spelling", "grammar", "校正", "誤字"],
    },
    "make-shorter": {
      title: "短くする",
      description: "より簡潔に書き直します",
      aliases: ["shorter", "短く"],
    },
    "make-longer": {
      title: "長くする",
      description: "役立つ詳細を加えて展開します",
      aliases: ["longer", "長く"],
    },
  },
  placeholder: {
    paragraph: "「/」でコマンドを表示…",
    heading1: "見出し1",
    heading2: "見出し2",
    heading3: "見出し3",
    listItem: "リスト",
    taskItem: "ToDo",
    blockquote: "引用",
    callout: "コールアウト",
    details: "トグル",
    toggleHeading1: "トグル見出し1",
    toggleHeading2: "トグル見出し2",
    toggleHeading3: "トグル見出し3",
  },
  blockMenu: { duplicate: "複製", delete: "削除" },
  bubbleToolbar: {
    bold: "太字",
    italic: "斜体",
    strike: "取り消し線",
    code: "コード",
    link: "リンク",
  },
  untitledPage: "無題",
  uploadFailed: "アップロードに失敗しました",
};

const es: SlashEditorMessages = {
  hint: "Escribe para buscar",
  groups: {
    "Basic blocks": "Bloques básicos",
    "Advanced blocks": "Bloques avanzados",
    Media: "Multimedia",
    Structure: "Estructura",
    Inline: "En línea",
    AI: "IA",
    Pages: "Páginas",
  },
  items: {
    paragraph: {
      title: "Texto",
      description: "Párrafo simple",
      aliases: ["paragraph", "plain", "parrafo", "texto"],
    },
    "heading-1": {
      title: "Título 1",
      description: "Título de sección grande",
      aliases: ["h1", "title", "titulo"],
    },
    "heading-2": {
      title: "Título 2",
      description: "Título de sección mediano",
      aliases: ["h2", "subtitle", "subtitulo"],
    },
    "heading-3": { title: "Título 3", description: "Título de sección pequeño", aliases: ["h3"] },
    "bullet-list": {
      title: "Lista con viñetas",
      description: "Lista sin orden",
      aliases: ["ul", "bullet", "vinetas", "lista"],
    },
    "ordered-list": {
      title: "Lista numerada",
      description: "Lista ordenada",
      aliases: ["ol", "numbered", "numerada"],
    },
    "task-list": {
      title: "Lista de tareas",
      description: "Lista de verificación con casillas",
      aliases: ["todo", "checklist", "checkbox", "tareas", "pendientes"],
    },
    blockquote: {
      title: "Cita",
      description: "Insertar una cita",
      aliases: ["quote", "citation", "cita"],
    },
    callout: {
      title: "Destacado",
      description: "Nota resaltada",
      aliases: ["note", "info", "tip", "nota", "aviso"],
    },
    toggle: {
      title: "Lista desplegable",
      description: "Contenido plegable",
      aliases: ["details", "collapse", "dropdown", "desplegable", "plegable"],
    },
    "code-block": {
      title: "Bloque de código",
      description: "Código en fuente monoespaciada",
      aliases: ["code", "snippet", "codigo", "fragmento"],
    },
    "toggle-heading-1": {
      title: "Título desplegable 1",
      description: "Título grande plegable",
      aliases: ["th1", "toggleheading1"],
    },
    "toggle-heading-2": {
      title: "Título desplegable 2",
      description: "Título mediano plegable",
      aliases: ["th2", "toggleheading2"],
    },
    "toggle-heading-3": {
      title: "Título desplegable 3",
      description: "Título pequeño plegable",
      aliases: ["th3", "toggleheading3"],
    },
    mermaid: {
      title: "Diagrama Mermaid",
      description: "Diagramas de flujo, de secuencia y más",
      aliases: ["diagram", "flowchart", "chart", "graph", "diagrama"],
    },
    "horizontal-rule": {
      title: "Divisor",
      description: "Separador visual",
      aliases: ["divider", "hr", "rule", "separador", "linea"],
    },
    image: {
      title: "Imagen",
      description: "Subir o insertar una imagen",
      aliases: ["image", "picture", "photo", "imagen", "foto"],
    },
    file: {
      title: "Archivo",
      description: "Subir o adjuntar un archivo",
      aliases: ["file", "attachment", "upload", "archivo", "adjunto"],
    },
    video: {
      title: "Vídeo",
      description: "Subir o insertar un vídeo",
      aliases: ["video", "movie", "pelicula"],
    },
    embed: {
      title: "Insertar enlace",
      description: "Marcador o iframe a partir de un enlace",
      aliases: ["embed", "bookmark", "link", "iframe", "incrustar", "enlace"],
    },
    table: {
      title: "Tabla",
      description: "Filas y columnas de celdas",
      aliases: ["table", "grid", "tabla"],
    },
    columns: {
      title: "Columnas",
      description: "Diseño en paralelo",
      aliases: ["columns", "layout", "columnas", "diseno"],
    },
    emoji: {
      title: "Emoji",
      description: "Buscar e insertar un emoji",
      aliases: ["emoji", "emoticon", "smiley", "emoticono"],
    },
    page: {
      title: "Página",
      description: "Crear una subpágina dentro de esta página",
      aliases: ["page", "subpage", "pagina", "subpagina"],
    },
    "link-to-page": {
      title: "Enlace a página",
      description: "Enlazar una página existente",
      aliases: ["link", "page link", "enlace"],
    },
    "continue-writing": {
      title: "Continuar escribiendo",
      description: "La IA continúa el texto sobre el cursor",
      aliases: ["continue", "continuar"],
    },
    summarize: {
      title: "Resumir",
      description: "Resumir el texto original",
      aliases: ["summarize", "resumir"],
    },
    "brainstorm-ideas": {
      title: "Lluvia de ideas",
      description: "Enumerar ideas relacionadas con el texto",
      aliases: ["brainstorm", "ideas"],
    },
    "improve-writing": {
      title: "Mejorar redacción",
      description: "Reescribir con más claridad y fluidez",
      aliases: ["improve", "mejorar"],
    },
    "fix-spelling-grammar": {
      title: "Corregir ortografía y gramática",
      description: "Corregir errores sin cambiar el significado",
      aliases: ["fix", "spelling", "grammar", "ortografia", "gramatica"],
    },
    "make-shorter": {
      title: "Acortar",
      description: "Reescribir de forma más concisa",
      aliases: ["shorter", "corto"],
    },
    "make-longer": {
      title: "Alargar",
      description: "Ampliar con detalles útiles",
      aliases: ["longer", "largo"],
    },
  },
  placeholder: {
    paragraph: "Escribe '/' para ver los comandos…",
    heading1: "Título 1",
    heading2: "Título 2",
    heading3: "Título 3",
    listItem: "Lista",
    taskItem: "Tarea",
    blockquote: "Cita",
    callout: "Destacado",
    details: "Desplegable",
    toggleHeading1: "Título desplegable 1",
    toggleHeading2: "Título desplegable 2",
    toggleHeading3: "Título desplegable 3",
  },
  blockMenu: { duplicate: "Duplicar", delete: "Eliminar" },
  bubbleToolbar: {
    bold: "Negrita",
    italic: "Cursiva",
    strike: "Tachado",
    code: "Código",
    link: "Enlace",
  },
  untitledPage: "Sin título",
  uploadFailed: "Error al subir el archivo",
};

/** `search` is a word that matches the table item in that language, for the demo's hint. */
export const LOCALES = [
  { code: "en", label: "English", search: "table", messages: {} },
  { code: "vi", label: "Tiếng Việt", search: "bảng", messages: vi },
  { code: "fr", label: "Français", search: "tableau", messages: fr },
  { code: "ja", label: "日本語", search: "テーブル", messages: ja },
  { code: "es", label: "Español", search: "tabla", messages: es },
] as const satisfies readonly {
  code: string;
  label: string;
  search: string;
  messages: SlashEditorMessages;
}[];

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";
