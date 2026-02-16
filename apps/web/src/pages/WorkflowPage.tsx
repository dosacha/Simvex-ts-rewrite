import { useEffect, useState } from "react";
import { getUserId } from "../app/user";

interface WorkflowFile {
  id: number;
  fileName: string;
  url: string;
}

interface WorkflowNode {
  id: number;
  title: string;
  content: string;
  x: number;
  y: number;
  files: WorkflowFile[];
}

interface WorkflowConnection {
  id: number;
  from: number;
  to: number;
  fromAnchor: string;
  toAnchor: string;
}

export function WorkflowPage() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [fromNodeId, setFromNodeId] = useState<number | "">("");
  const [toNodeId, setToNodeId] = useState<number | "">("");

  async function refresh() {
    const res = await fetch("/api/workflow", {
      headers: { "X-User-ID": getUserId() },
    });
    if (!res.ok) return;

    const data = (await res.json()) as { nodes: WorkflowNode[]; connections: WorkflowConnection[] };
    setNodes(data.nodes);
    setConnections(data.connections);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function addNode() {
    await fetch("/api/workflow/nodes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": getUserId(),
      },
      body: JSON.stringify({ title: "새 노드", content: "", x: 200, y: 120 }),
    });
    await refresh();
  }

  async function saveNode(node: WorkflowNode) {
    await fetch(`/api/workflow/nodes/${node.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": getUserId(),
      },
      body: JSON.stringify({
        title: node.title,
        content: node.content,
        x: node.x,
        y: node.y,
      }),
    });
  }

  async function saveNodeById(nodeId: number) {
    const node = nodes.find((item) => item.id === nodeId);
    if (!node) return;
    await saveNode(node);
  }

  async function removeNode(id: number) {
    await fetch(`/api/workflow/nodes/${id}`, {
      method: "DELETE",
      headers: { "X-User-ID": getUserId() },
    });
    await refresh();
  }

  async function addConnection() {
    if (fromNodeId === "" || toNodeId === "") return;

    await fetch("/api/workflow/connections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": getUserId(),
      },
      body: JSON.stringify({
        from: fromNodeId,
        to: toNodeId,
        fromAnchor: "right",
        toAnchor: "left",
      }),
    });

    setFromNodeId("");
    setToNodeId("");
    await refresh();
  }

  async function removeConnection(id: number) {
    await fetch(`/api/workflow/connections?id=${id}`, {
      method: "DELETE",
      headers: { "X-User-ID": getUserId() },
    });
    await refresh();
  }

  async function uploadFile(nodeId: number, file: File | null) {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await fetch(`/api/workflow/nodes/${nodeId}/files`, {
      method: "POST",
      headers: {
        "X-User-ID": getUserId(),
      },
      body: formData,
    });

    await refresh();
  }

  async function removeFile(fileId: number) {
    await fetch(`/api/workflow/files/${fileId}`, {
      method: "DELETE",
      headers: { "X-User-ID": getUserId() },
    });

    await refresh();
  }

  return (
    <section>
      <h1>Workflow</h1>
      <p>노드, 연결, 첨부 파일을 간단히 관리할 수 있는 편집 화면입니다.</p>

      <button type="button" onClick={() => void addNode()}>
        노드 추가
      </button>

      <h2>노드 목록</h2>
      {nodes.length === 0 ? <p>등록된 노드가 없습니다.</p> : null}
      <ul>
        {nodes.map((node) => (
          <li key={node.id}>
            <input
              value={node.title}
              onChange={(event) => {
                const title = event.target.value;
                setNodes((prev) => prev.map((item) => (item.id === node.id ? { ...item, title } : item)));
              }}
              onBlur={() => void saveNodeById(node.id)}
            />
            <br />
            <textarea
              value={node.content}
              onChange={(event) => {
                const content = event.target.value;
                setNodes((prev) => prev.map((item) => (item.id === node.id ? { ...item, content } : item)));
              }}
              onBlur={() => void saveNodeById(node.id)}
            />
            <br />
            <input type="file" onChange={(event) => void uploadFile(node.id, event.target.files?.[0] ?? null)} />
            <button type="button" onClick={() => void removeNode(node.id)}>
              노드 삭제
            </button>
            {node.files.length > 0 ? (
              <ul>
                {node.files.map((file) => (
                  <li key={file.id}>
                    <a href={file.url} target="_blank" rel="noreferrer">
                      {file.fileName}
                    </a>
                    <button type="button" onClick={() => void removeFile(file.id)}>
                      파일 삭제
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>

      <h2>연결</h2>
      <select value={fromNodeId} onChange={(event) => setFromNodeId(Number(event.target.value) || "")}> 
        <option value="">출발 노드 선택</option>
        {nodes.map((node) => (
          <option key={`from-${node.id}`} value={node.id}>
            {node.title} (#{node.id})
          </option>
        ))}
      </select>
      <select value={toNodeId} onChange={(event) => setToNodeId(Number(event.target.value) || "")}> 
        <option value="">도착 노드 선택</option>
        {nodes.map((node) => (
          <option key={`to-${node.id}`} value={node.id}>
            {node.title} (#{node.id})
          </option>
        ))}
      </select>
      <button type="button" onClick={() => void addConnection()}>
        연결 추가
      </button>

      <ul>
        {connections.map((connection) => (
          <li key={connection.id}>
            #{connection.id}: {connection.from} -> {connection.to}
            <button type="button" onClick={() => void removeConnection(connection.id)}>
              연결 삭제
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
