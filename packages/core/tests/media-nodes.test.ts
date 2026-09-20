import { getSchema } from "@tiptap/core";
import { expect, test } from "vite-plus/test";
import { createBlockKit } from "../src/index.ts";

test("image defaults to ready with no src, and persists an uploading/error state", () => {
  const schema = getSchema(createBlockKit());

  const empty = schema.nodes.image!.create();
  expect(empty.attrs).toMatchObject({
    src: null,
    alt: null,
    width: null,
    status: "ready",
    error: null,
  });

  const doc = {
    type: "doc",
    content: [
      {
        type: "image",
        attrs: {
          id: "img1",
          src: null,
          alt: "diagram",
          width: null,
          status: "error",
          error: "network",
        },
      },
    ],
  };
  expect(schema.nodeFromJSON(doc).toJSON()).toEqual(doc);
});

test("file defaults to ready with no src, and persists name/size/mime", () => {
  const schema = getSchema(createBlockKit());

  const empty = schema.nodes.file!.create();
  expect(empty.attrs).toMatchObject({
    src: null,
    name: null,
    size: null,
    mime: null,
    status: "ready",
  });

  const doc = {
    type: "doc",
    content: [
      {
        type: "file",
        attrs: {
          id: "file1",
          src: "https://example.com/report.pdf",
          name: "report.pdf",
          size: 2048,
          mime: "application/pdf",
          status: "ready",
          error: null,
        },
      },
    ],
  };
  expect(schema.nodeFromJSON(doc).toJSON()).toEqual(doc);
});

test("video defaults to ready with no src, and persists an uploading state", () => {
  const schema = getSchema(createBlockKit());

  const empty = schema.nodes.video!.create();
  expect(empty.attrs).toMatchObject({ src: null, poster: null, status: "ready", error: null });

  const doc = {
    type: "doc",
    content: [
      {
        type: "video",
        attrs: { id: "vid1", src: null, poster: null, status: "uploading", error: null },
      },
    ],
  };
  expect(schema.nodeFromJSON(doc).toJSON()).toEqual(doc);
});

test("embed defaults to bookmark mode and persists an iframe mode with metadata", () => {
  const schema = getSchema(createBlockKit());

  const empty = schema.nodes.embed!.create();
  expect(empty.attrs).toMatchObject({ url: null, mode: "bookmark", title: null });

  const doc = {
    type: "doc",
    content: [
      {
        type: "embed",
        attrs: {
          id: "embed1",
          url: "https://example.com",
          mode: "iframe",
          title: "Example",
          description: "A site",
          thumbnail: null,
        },
      },
    ],
  };
  expect(schema.nodeFromJSON(doc).toJSON()).toEqual(doc);
});

test("image, file, video, and embed can be opted out of the block kit", () => {
  const schema = getSchema(
    createBlockKit({ image: false, file: false, video: false, embed: false }),
  );

  expect(schema.nodes.image).toBeUndefined();
  expect(schema.nodes.file).toBeUndefined();
  expect(schema.nodes.video).toBeUndefined();
  expect(schema.nodes.embed).toBeUndefined();
});
