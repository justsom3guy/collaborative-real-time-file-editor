import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const ToolBarOptions = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

const Editor = () => {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState();
  const [quil, setQuil] = useState();

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;

    wrapper.innerHTML = "";

    const editor = document.createElement("div");
    wrapper.append(editor);

    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: ToolBarOptions },
    });

    q.disable();
    q.setText(`Loading ...`);
    setQuil(q);
  }, []);

  useEffect(() => {
    const s = io("http://localhost:3001");

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quil == null) return;

    socket.once("load-document", (document) => {
      quil.setContents(document);
      quil.enable();
    });

    socket.emit("get-document", documentId);
  }, [quil, socket, documentId]);

  useEffect(() => {
    if (socket == null || quil == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-change", delta);
    };

    quil.on("text-change", handler);

    return () => {
      quil.off("text-change", handler);
    };
  }, [quil, socket]);

  useEffect(() => {
    if (socket == null || quil == null) return;

    const handler = (changes) => {
      quil.updateContents(changes);
    };

    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [quil, socket]);

  return <div className="container" ref={wrapperRef}></div>;
};

export default Editor;
