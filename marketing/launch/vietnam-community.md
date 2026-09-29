# Cộng đồng Việt Nam

Kênh: Viblo (bài dài), Facebook groups (bài ngắn + video), Threads, LinkedIn.
Lịch: 1–2 ngày sau HN. Mỗi group một bài, không đăng cùng lúc.

Groups gợi ý (đọc luật group trước): ReactJS Vietnam, Frontend Developer Vietnam,
Javascript Việt Nam, J2TEAM Community, Vietnam Open Source, Cộng đồng Next.js Việt Nam.

---

## Facebook / Threads (ngắn)

Chào mọi người, mình vừa open source **slash-editor**: một block editor kiểu Notion cho React. 🧩

✅ Gõ `/` để chèn block, kéo thả để sắp xếp (kể cả block lồng nhau)
✅ Real-time collab (Yjs), comment, mention, AI (tự cắm model của bạn)
✅ Table, columns, toggle, callout, Mermaid, mục lục, import/export markdown
✅ UI cài qua **shadcn registry**, nên code component nằm trong repo của bạn và sửa thoải mái
✅ **MIT 100%**, không có bản trả phí, không phụ thuộc dịch vụ hosted

Playground: https://slasheditor.dev/playground
GitHub: https://github.com/buiducnhat/slash-editor

Mình đang cần góp ý về API trước khi lên 1.0. Nếu thấy hữu ích, mọi người cho mình xin 1 ⭐ nhé.
Anh em muốn đóng góp có thể xem các issue gắn nhãn `good first issue` 🙏

[đính kèm demo-60s-vertical.mp4]

---

## Viblo (bài dài)

**Tiêu đề:** Xây dựng block editor kiểu Notion cho React: kiến trúc headless + shadcn registry

**Tags:** React, Tiptap, ProseMirror, Open Source, shadcn

**Dàn ý** (dịch và mở rộng từ `blog-launch-post.md`):

1. Vấn đề: engine có sẵn và miễn phí, nhưng lớp UX block (slash, drag, comment) thì hiếm hoặc
   phải trả phí.
2. Kiến trúc 3 lớp: _core computes, react coordinates, registry renders_. Có sơ đồ.
3. Vì sao phân phối UI qua shadcn registry thay vì npm component.
4. Deep dive drag handle: vì sao không dùng `posAtCoords`, hit-test bằng block rects,
   `contentMatchAt` cho nesting.
5. Thiết kế an toàn cho Yjs: block id sinh một lần, attrs deterministic.
6. Cài đặt nhanh (code), custom slash item (code).
7. Roadmap và cách đóng góp.

---

## LinkedIn

Sau vài năm làm sản phẩm có editor, mình open source **slash-editor**: block editor kiểu Notion
cho React, MIT hoàn toàn.

Điểm khác biệt: logic cập nhật qua npm, còn UI được copy vào codebase của bạn qua shadcn
registry. Team sở hữu hoàn toàn markup và style, không bị khoá vào vendor.

Có sẵn collab real-time, comment, AI adapter, Mermaid, markdown.

🔗 https://slasheditor.dev
#opensource #react #frontend #nextjs
