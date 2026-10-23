import React, { useState, useRef } from "react";
import "../../styles/chest.css";

export default function ImportChest({ onFileLoaded }) {
  const [chestState, setChestState] = useState("idle"); // "idle" | "drag-over" | "importing" | "success" | "error"
  const [isDragOver, setIsDragOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Drop a report CSV or click");
  const fileInputRef = useRef(null);

  const resetToIdleAfterDelay = () => {
    setTimeout(() => {
      setChestState("idle");
      setStatusMessage("Drop a report CSV or click");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, 4000);
  };

  const processFile = (file) => {
    if (!file) return;

    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setChestState("error");
      setStatusMessage("Only .csv files supported");
      resetToIdleAfterDelay();
      onFileLoaded?.(null, "Invalid file format. Please upload a .csv file.");
      return;
    }

    setChestState("importing");
    setStatusMessage("Reading file...");

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      onFileLoaded?.(content, null, (result) => {
        if (result.success) {
          setChestState("success");
          setStatusMessage(`Imported ${result.count} records`);
        } else {
          setChestState("error");
          setStatusMessage("Could not import");
        }
        resetToIdleAfterDelay();
      });
    };

    reader.onerror = () => {
      setChestState("error");
      setStatusMessage("Could not import");
      resetToIdleAfterDelay();
      onFileLoaded?.(null, "Error reading file content from device.");
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    if (chestState === "idle") {
      setStatusMessage("Release to import");
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (chestState === "idle") {
      setStatusMessage("Drop a report CSV or click");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="cc-import">
      <div
        className={`cc-chest-stage ${isDragOver ? "is-dragover" : ""} ${chestState === "importing" ? "is-busy" : ""}`}
        data-state={chestState}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="cc-file-input"
          accept=".csv,text/csv"
          aria-label="Import a report CSV"
          onChange={handleFileChange}
        />

        <div className="cc-chest" aria-hidden="true">
          <div className="cc-part cc-base">
            {["front", "back", "left", "right", "bottom", "top"].map((s) => (
              <div key={s} className={`cc-side cc-base-${s}`} />
            ))}
          </div>
          <div className="cc-part cc-lid">
            {["front", "back", "left", "right", "bottom", "top"].map((s) => (
              <div key={s} className={`cc-side cc-lid-${s}`} />
            ))}
            <div className="cc-latch">
              {["front", "back", "left", "right", "top", "bottom"].map((s) => (
                <div key={s} className={`cc-latch-f cc-latch-${s}`} />
              ))}
            </div>
          </div>
        </div>

        <p className="cc-chest-text" aria-live="polite">
          {statusMessage}
        </p>
      </div>
    </div>
  );
}
