import { Dialog } from "@/components/ui/Dialog";
import { createProject, validateGraphJson } from "@/lib/graph-storage";
import { useState } from "react";

interface AddGraphDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function AddGraphDialog({ open, onOpenChange, onCreated }: AddGraphDialogProps) {
  const [title, setTitle] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setJsonText("");
    setError(null);
    setSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("请输入图谱标题");
      return;
    }

    const result = validateGraphJson(jsonText);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSubmitting(true);
    const project = createProject(trimmedTitle, result.graph);
    onCreated();
    handleOpenChange(false);
    window.open(`/graph/${project.id}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="新增知识图谱"
      description="填写标题并粘贴合规的图谱 JSON，保存后将在新标签页打开详情。"
    >
      <div className="add-graph-form">
        <label className="add-graph-form__field">
          <span className="add-graph-form__label">标题</span>
          <input
            className="add-graph-form__input"
            type="text"
            value={title}
            placeholder="例如：达格列净知识图谱"
            onChange={(event) => {
              setTitle(event.target.value);
              setError(null);
            }}
          />
        </label>

        <label className="add-graph-form__field">
          <span className="add-graph-form__label">图谱 JSON</span>
          <textarea
            className="add-graph-form__textarea"
            value={jsonText}
            rows={12}
            placeholder='支持 [{ "graph": { "nodes": [], "edges": [] } }] 或 { "nodes": [], "edges": [] }'
            onChange={(event) => {
              setJsonText(event.target.value);
              setError(null);
            }}
          />
        </label>

        {error ? <p className="add-graph-form__error">{error}</p> : null}

        <div className="add-graph-form__actions">
          <button type="button" className="add-graph-form__btn add-graph-form__btn--ghost" onClick={() => handleOpenChange(false)}>
            取消
          </button>
          <button
            type="button"
            className="add-graph-form__btn add-graph-form__btn--primary"
            disabled={submitting}
            onClick={handleSubmit}
          >
            保存并打开
          </button>
        </div>
      </div>
    </Dialog>
  );
}
