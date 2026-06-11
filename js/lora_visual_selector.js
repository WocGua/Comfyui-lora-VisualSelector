import { app } from "../../scripts/app.js";

const EXTENSION_NAME = "comfyui.lora_visual_selector";
const NODE_NAME = "LoraVisualSelector";
const GRID_WIDTH = 840;
const GRID_HEIGHT = 640;
const NODE_EXTRA_HEIGHT = 190;
const NODE_WIDTH_PADDING = 28;
const MIN_WIDGET_WIDTH = 400;
const MIN_WIDGET_HEIGHT = 300;

let cachedItems = null;

function injectStyle() {
    if (document.getElementById("lvs-style")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "lvs-style";
    style.textContent = `
.lvs-inline {
    width: 100%;
    height: 100%;
    min-width: 400px;
    min-height: 300px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background: #2d2d2d;
    border: 1px solid #6a6a6a;
    border-radius: 8px;
    overflow: hidden;
    color: #f2f2f2;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    transform-origin: top left;
    position: relative;
}
.lvs-toolbar {
    display: grid;
    grid-template-columns: 34px 34px 34px minmax(120px, 180px) 1fr 40px 40px;
    gap: 9px;
    align-items: center;
    padding: 10px 12px 8px;
    background: #343434;
    border-bottom: 1px solid #4a4a4a;
}
.lvs-icon-button {
    width: 34px;
    height: 32px;
    display: grid;
    place-items: center;
    border: 1px solid #666;
    border-radius: 6px;
    background: #232323;
    color: #f4f4f4;
    cursor: pointer;
    font-size: 17px;
    line-height: 1;
}
.lvs-icon-button:hover {
    background: #3c3c3c;
}
.lvs-search-wrap {
    position: relative;
}
.lvs-folder {
    width: 100%;
    height: 34px;
    box-sizing: border-box;
    border: 1px solid #060606;
    border-radius: 7px;
    background: #08090c;
    color: #f4f4f4;
    padding: 0 9px;
    font-size: 13px;
    outline: none;
}
.lvs-search {
    width: 100%;
    height: 34px;
    box-sizing: border-box;
    border: 1px solid #060606;
    border-radius: 7px;
    background: #08090c;
    color: #f4f4f4;
    padding: 0 12px 0 36px;
    font-size: 15px;
    outline: none;
}
.lvs-search-icon {
    position: absolute;
    left: 11px;
    top: 8px;
    width: 14px;
    height: 14px;
    border: 2px solid #f3f3f3;
    border-radius: 999px;
    pointer-events: none;
}
.lvs-search-icon::after {
    content: "";
    position: absolute;
    width: 8px;
    height: 2px;
    right: -7px;
    bottom: -4px;
    background: #f3f3f3;
    transform: rotate(45deg);
}
.lvs-grid {
    flex: 1;
    overflow: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    grid-auto-rows: minmax(180px, auto);
    gap: 14px;
    padding: 14px;
    background: #272727;
}
.lvs-card {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 0;
    border: 1px solid #666;
    border-radius: 8px;
    background: #171717;
    color: #f5f5f5;
    cursor: pointer;
    text-align: left;
}
.lvs-card:hover {
    border-color: #a2a2a2;
}
.lvs-card.is-selected {
    border-color: #84d981;
    box-shadow: inset 0 0 0 2px rgba(132, 217, 129, 0.25);
}
.lvs-preview {
    flex: 1;
    min-height: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: linear-gradient(135deg, #555, #191919);
    border-radius: 8px 8px 0 0;
}
.lvs-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.lvs-placeholder {
    padding: 9px;
    text-align: center;
    color: #d0d0d0;
    font-size: 12px;
    line-height: 1.35;
}
.lvs-label {
    min-height: 27px;
    display: flex;
    align-items: center;
    padding: 4px 7px;
    background: rgba(0, 0, 0, 0.72);
    color: #f3f3f3;
    font-size: 11px;
    font-weight: 600;
    overflow: hidden;
    word-wrap: break-word;
    line-height: 1.3;
}
.lvs-check {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    border: 2px solid rgba(255, 255, 255, 0.85);
    background: rgba(0, 0, 0, 0.45);
    opacity: 0;
}
.lvs-card.is-selected .lvs-check {
    opacity: 1;
    background: #2aaa46;
    border-color: #e4ffe9;
}
.lvs-card.is-selected .lvs-check::after {
    content: "";
    position: absolute;
    left: 6px;
    top: 3px;
    width: 6px;
    height: 11px;
    border: solid white;
    border-width: 0 3px 3px 0;
    transform: rotate(45deg);
}
.lvs-upload {
    position: absolute;
    left: 6px;
    top: 6px;
    height: 24px;
    padding: 0 7px;
    border: 1px solid rgba(255, 255, 255, 0.65);
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.64);
    color: white;
    font-size: 12px;
    cursor: pointer;
    opacity: 0;
}
.lvs-card:hover .lvs-upload,
.lvs-card:focus-within .lvs-upload {
    opacity: 1;
}
.lvs-prompt-button {
    position: absolute;
    left: 6px;
    top: 36px;
    height: 24px;
    min-width: 24px;
    padding: 0 7px;
    border: 1px solid rgba(255, 255, 255, 0.65);
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.64);
    color: white;
    font-size: 12px;
    cursor: pointer;
    opacity: 0;
}
.lvs-card:hover .lvs-prompt-button,
.lvs-card:focus-within .lvs-prompt-button,
.lvs-card.has-prompt .lvs-prompt-button {
    opacity: 1;
}
.lvs-card.has-prompt .lvs-prompt-button {
    border-color: #f0d66c;
    color: #ffe88a;
}
.lvs-dialog-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.62);
}
.lvs-dialog {
    width: min(680px, 100%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border: 1px solid #696969;
    border-radius: 8px;
    background: #202020;
    color: #f4f4f4;
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.5);
}
.lvs-dialog-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.35;
}
.lvs-dialog textarea {
    width: 100%;
    min-height: 180px;
    box-sizing: border-box;
    resize: vertical;
    border: 1px solid #555;
    border-radius: 6px;
    background: #101010;
    color: #f4f4f4;
    padding: 10px;
    font: 13px/1.45 ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
    outline: none;
}
.lvs-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
.lvs-dialog-actions button {
    min-width: 72px;
    height: 32px;
    border: 1px solid #666;
    border-radius: 6px;
    background: #303030;
    color: #f4f4f4;
    cursor: pointer;
}
.lvs-dialog-actions button:hover {
    background: #3d3d3d;
}
.lvs-dialog-actions .is-primary {
    border-color: #76bd73;
    background: #2f6f35;
}
.lvs-empty,
.lvs-loading {
    grid-column: 1 / -1;
    display: grid;
    place-items: center;
    min-height: 220px;
    color: #d8d8d8;
    font-size: 14px;
}
`;
    document.head.appendChild(style);
}

function getWidget(node, name) {
    return node.widgets?.find((widget) => widget.name === name);
}

function hideWidget(widget) {
    if (!widget) {
        return;
    }
    widget.type = "hidden";
    widget.computeSize = () => [0, -4];
    widget.serialize = true;
    widget.hidden = true;
}

function hideWidgetByName(node, name) {
    hideWidget(getWidget(node, name));
}

function syncNodeLayout(node, widgetSize = {}) {
    const widgetWidth = widgetSize.width || GRID_WIDTH;
    const widgetHeight = widgetSize.height || GRID_HEIGHT;
    const extraHeight = widgetSize.extraHeight || NODE_EXTRA_HEIGHT;
    const desiredSize = [widgetWidth + NODE_WIDTH_PADDING, widgetHeight + extraHeight];
    let computedSize = desiredSize;

    if (typeof node.computeSize === "function") {
        computedSize = node.computeSize();
    }

    const nextSize = [
        Math.max(desiredSize[0], computedSize?.[0] || 0),
        Math.max(desiredSize[1], computedSize?.[1] || 0),
    ];

    if (typeof node.setSize === "function") {
        node.setSize(nextSize);
    } else {
        node.size = nextSize;
    }

    node.setDirtyCanvas?.(true, true);
}

function parseSelected(value) {
    if (!value) {
        return [];
    }
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed
                .map((item) => {
                    if (typeof item === "string") {
                        return { name: item, prompt: "" };
                    }
                    if (!item?.name) {
                        return null;
                    }
                    return {
                        name: String(item.name),
                        prompt: typeof item.prompt === "string" ? item.prompt : "",
                    };
                })
                .filter((item) => item?.name);
        }
    } catch (error) {
        return [];
    }
    return [];
}

function getSelected(node) {
    return parseSelected(getWidget(node, "selected_loras")?.value).map((item) => item.name);
}

function getSelectedPrompts(node) {
    return new Map(
        parseSelected(getWidget(node, "selected_loras")?.value)
            .filter((item) => item.prompt)
            .map((item) => [item.name, item.prompt])
    );
}

function saveSelected(node, selected, items = [], selectedPrompts = new Map()) {
    const widget = getWidget(node, "selected_loras");
    if (!widget) {
        return;
    }
    const itemPrompts = new Map(items.map((item) => [item.name, item.prompt || ""]));
    widget.value = JSON.stringify(selected.map((name) => {
        const prompt = itemPrompts.get(name) || selectedPrompts.get(name) || "";
        return prompt ? { name, prompt } : { name };
    }));
    node.setDirtyCanvas(true, true);
}

function getFolderName(item) {
    const parts = item.name.split(/[\\/]/);
    return parts.length > 1 ? parts.slice(0, -1).join("/") : "";
}

function getFolders(items) {
    return [...new Set(items.map(getFolderName))]
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function getVisibleItems(state) {
    const normalizedQuery = state.query.trim().toLowerCase();
    return state.items.filter((item) => {
        const matchesFolder = !state.folder || getFolderName(item) === state.folder;
        const matchesQuery = !normalizedQuery
            || item.name.toLowerCase().includes(normalizedQuery)
            || item.label.toLowerCase().includes(normalizedQuery)
            || (item.prompt || "").toLowerCase().includes(normalizedQuery);
        return matchesFolder && matchesQuery;
    });
}

async function fetchItems(force = false) {
    if (cachedItems && !force) {
        return cachedItems;
    }
    const response = await fetch("/lora_visual_selector/list");
    if (!response.ok) {
        throw new Error(`LoRA list request failed: ${response.status}`);
    }
    const payload = await response.json();
    cachedItems = payload.items || [];
    return cachedItems;
}

function createIconButton(title, text) {
    const button = document.createElement("button");
    button.className = "lvs-icon-button";
    button.type = "button";
    button.title = title;
    button.textContent = text;
    return button;
}

function uploadThumbnail(item, afterUpload) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        const form = new FormData();
        form.append("lora_name", item.name);
        form.append("image", file, file.name);

        const response = await fetch("/lora_visual_selector/upload", {
            method: "POST",
            body: form,
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            alert(payload.error || "Upload failed.");
            return;
        }

        const payload = await response.json();
        item.thumbnail = payload.thumbnail;
        afterUpload();
    });
    input.click();
}

async function savePrompt(item, prompt) {
    const response = await fetch("/lora_visual_selector/prompt", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            lora_name: item.name,
            prompt,
        }),
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Prompt save failed.");
    }

    return response.json();
}

function editPrompt(item, state) {
    const backdrop = document.createElement("div");
    backdrop.className = "lvs-dialog-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "lvs-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");

    const title = document.createElement("div");
    title.className = "lvs-dialog-title";
    title.textContent = item.label;
    title.title = item.name;

    const textarea = document.createElement("textarea");
    textarea.value = item.prompt || "";
    textarea.placeholder = "Built-in prompt / trigger words";

    const actions = document.createElement("div");
    actions.className = "lvs-dialog-actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "is-primary";
    saveButton.textContent = "Save";

    const close = () => backdrop.remove();
    cancelButton.addEventListener("click", close);
    backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) {
            close();
        }
    });
    dialog.addEventListener("click", (event) => event.stopPropagation());
    textarea.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            close();
        }
    });

    saveButton.addEventListener("click", async () => {
        const prompt = textarea.value.trim();
        saveButton.disabled = true;
        saveButton.textContent = "Saving";
        try {
            const payload = await savePrompt(item, prompt);
            item.prompt = payload.prompt || "";
            state.selectedPrompts.set(item.name, item.prompt);
            if (!item.prompt) {
                state.selectedPrompts.delete(item.name);
            }
            cachedItems = state.items;
            if (state.selectedSet.has(item.name)) {
                saveSelected(state.node, [...state.selectedSet], state.items, state.selectedPrompts);
            }
            close();
            renderGrid(state);
        } catch (error) {
            alert(error.message || "Prompt save failed.");
            saveButton.disabled = false;
            saveButton.textContent = "Save";
        }
    });

    actions.append(cancelButton, saveButton);
    dialog.append(title, textarea, actions);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);
    textarea.focus();
    textarea.select();
}

function findLoraForImage(items, fileName) {
    let baseName = fileName.replace(/\.(png|jpg|jpeg|webp|gif)$/i, "");
    baseName = baseName.replace(/\.(safetensors|ckpt|pt)$/i, "");
    baseName = baseName.replace(/[_-]\d+[_-]*$/g, "");
    const normalizedBase = baseName.toLowerCase();

    return items.find((item) => {
        const loraPathName = item.name.replace(/\.(safetensors|ckpt|pt)$/i, "").toLowerCase();
        const loraFileName = loraPathName.split(/[\\/]/).pop() || loraPathName;
        return normalizedBase.includes(loraFileName)
            || loraFileName.includes(normalizedBase)
            || normalizedBase.includes(loraPathName)
            || loraPathName.includes(normalizedBase);
    });
}

function batchUploadThumbnails(state) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.multiple = true;

    input.addEventListener("change", async () => {
        const files = Array.from(input.files || []);
        if (!files.length) {
            return;
        }

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const file of files) {
            const matchedLora = findLoraForImage(state.items, file.name);
            if (!matchedLora) {
                console.log(`No matching LoRA found for thumbnail: ${file.name}`);
                skipCount++;
                continue;
            }

            const form = new FormData();
            form.append("lora_name", matchedLora.name);
            form.append("image", file, file.name);

            try {
                const response = await fetch("/lora_visual_selector/upload", {
                    method: "POST",
                    body: form,
                });

                if (!response.ok) {
                    errorCount++;
                    continue;
                }

                const payload = await response.json();
                matchedLora.thumbnail = payload.thumbnail;
                matchedLora.thumbnailVersion = Date.now();
                successCount++;
            } catch (error) {
                errorCount++;
                console.error(`Error uploading ${file.name}:`, error);
            }
        }

        cachedItems = state.items;
        renderGrid(state);
        alert(`Batch upload completed:\nSuccess: ${successCount}\nSkipped: ${skipCount}\nFailed: ${errorCount}`);
    });

    input.click();
}

function renderGrid(state) {
    const { node, grid, items, selectedSet, countButton } = state;
    grid.textContent = "";
    
    // Update count button
    if (countButton) {
        countButton.textContent = String(selectedSet.size);
    }

    const visible = getVisibleItems(state);

    if (!visible.length) {
        const empty = document.createElement("div");
        empty.className = "lvs-empty";
        empty.textContent = items.length ? "No matching LoRAs" : "No LoRAs found in models/loras";
        grid.appendChild(empty);
        return;
    }

    for (const item of visible) {
        const card = document.createElement("button");
        card.className = `lvs-card${selectedSet.has(item.name) ? " is-selected" : ""}${item.prompt ? " has-prompt" : ""}`;
        card.type = "button";
        card.title = item.prompt ? `${item.name}\n\n${item.prompt}` : item.name;

        const preview = document.createElement("div");
        preview.className = "lvs-preview";
        if (item.thumbnail) {
            const img = document.createElement("img");
            img.alt = item.label;
            img.src = `${item.thumbnail}?v=${item.thumbnailVersion || 0}`;
            preview.appendChild(img);
        } else {
            const placeholder = document.createElement("div");
            placeholder.className = "lvs-placeholder";
            placeholder.textContent = "Upload sample";
            preview.appendChild(placeholder);
        }

        const label = document.createElement("div");
        label.className = "lvs-label";
        label.textContent = item.label;
        label.title = item.name;

        const check = document.createElement("span");
        check.className = "lvs-check";
        check.setAttribute("aria-hidden", "true");

        const upload = document.createElement("button");
        upload.className = "lvs-upload";
        upload.type = "button";
        upload.textContent = "Upload";
        upload.title = "Upload a sample image";
        upload.addEventListener("click", (event) => {
            event.stopPropagation();
            uploadThumbnail(item, () => {
                item.thumbnailVersion = Date.now();
                cachedItems = state.items;
                renderGrid(state);
            });
        });

        const promptButton = document.createElement("button");
        promptButton.className = "lvs-prompt-button";
        promptButton.type = "button";
        promptButton.textContent = item.prompt ? "P*" : "P";
        promptButton.title = item.prompt ? "Edit built-in prompt" : "Add built-in prompt";
        promptButton.addEventListener("click", (event) => {
            event.stopPropagation();
            editPrompt(item, state);
        });

        card.append(preview, label, check, upload, promptButton);
        card.addEventListener("click", () => {
            if (selectedSet.has(item.name)) {
                selectedSet.delete(item.name);
            } else {
                selectedSet.add(item.name);
            }
            saveSelected(node, [...selectedSet], state.items, state.selectedPrompts);
            renderGrid(state);
        });
        grid.appendChild(card);
    }
}

function createInlineGallery(node) {
    injectStyle();

    const root = document.createElement("div");
    root.className = "lvs-inline";
    const widgetSize = {
        width: GRID_WIDTH,
        height: GRID_HEIGHT,
        extraHeight: NODE_EXTRA_HEIGHT,
    };
    const applyWidgetSize = (width, height) => {
        widgetSize.width = Math.max(Math.round(width || GRID_WIDTH), MIN_WIDGET_WIDTH);
        widgetSize.height = Math.max(Math.round(height || GRID_HEIGHT), MIN_WIDGET_HEIGHT);
        root.style.width = `${widgetSize.width}px`;
        root.style.height = `${widgetSize.height}px`;
    };
    const applyNodeResize = (size = node.size) => {
        applyWidgetSize(
            (size?.[0] || GRID_WIDTH + NODE_WIDTH_PADDING) - NODE_WIDTH_PADDING,
            (size?.[1] || GRID_HEIGHT + widgetSize.extraHeight) - widgetSize.extraHeight
        );
    };
    applyWidgetSize(GRID_WIDTH, GRID_HEIGHT);

    const toolbar = document.createElement("div");
    toolbar.className = "lvs-toolbar";

    const clearButton = createIconButton("Clear selection", "x");
    const batchUploadButton = createIconButton("Batch import thumbnails", "↑");
    const selectAllButton = createIconButton("Select all visible LoRAs", "all");
    const folderSelect = document.createElement("select");
    folderSelect.className = "lvs-folder";
    folderSelect.title = "Choose LoRA folder";
    const searchWrap = document.createElement("div");
    searchWrap.className = "lvs-search-wrap";
    const searchIcon = document.createElement("span");
    searchIcon.className = "lvs-search-icon";
    const search = document.createElement("input");
    search.className = "lvs-search";
    search.placeholder = "Search LoRAs...";
    search.type = "search";
    searchWrap.append(searchIcon, search);

    const refreshButton = createIconButton("Refresh LoRA list", "r");
    const countButton = createIconButton("Selected count", "0");
    toolbar.append(clearButton, batchUploadButton, selectAllButton, folderSelect, searchWrap, refreshButton, countButton);

    const grid = document.createElement("div");
    grid.className = "lvs-grid";
    const loading = document.createElement("div");
    loading.className = "lvs-loading";
    loading.textContent = "Loading LoRAs...";
    grid.appendChild(loading);

    root.append(toolbar, grid);

    const state = {
        node,
        grid,
        items: [],
        selectedSet: new Set(getSelected(node)),
        selectedPrompts: getSelectedPrompts(node),
        query: "",
        folder: "",
        countButton,
    };

    const updateFolderOptions = () => {
        const folders = getFolders(state.items);
        const current = state.folder;
        folderSelect.textContent = "";

        const allOption = document.createElement("option");
        allOption.value = "";
        allOption.textContent = "All folders";
        folderSelect.appendChild(allOption);

        for (const folder of folders) {
            const option = document.createElement("option");
            option.value = folder;
            option.textContent = folder || "Root";
            folderSelect.appendChild(option);
        }

        state.folder = folders.includes(current) ? current : "";
        folderSelect.value = state.folder;
    };

    const reload = async (force = false) => {
        grid.textContent = "";
        const reloading = document.createElement("div");
        reloading.className = "lvs-loading";
        reloading.textContent = "Loading LoRAs...";
        grid.appendChild(reloading);
        try {
            state.items = await fetchItems(force);
            for (const item of state.items) {
                const workflowPrompt = state.selectedPrompts.get(item.name);
                if (workflowPrompt && !item.prompt) {
                    item.prompt = workflowPrompt;
                }
                if (item.prompt) {
                    state.selectedPrompts.set(item.name, item.prompt);
                }
            }
            updateFolderOptions();
            const validNames = new Set(state.items.map((item) => item.name));
            state.selectedSet = new Set([...state.selectedSet].filter((name) => validNames.has(name)));
            saveSelected(node, [...state.selectedSet], state.items, state.selectedPrompts);
            countButton.textContent = String(state.selectedSet.size);
            renderGrid(state);
        } catch (error) {
            grid.textContent = "";
            const empty = document.createElement("div");
            empty.className = "lvs-empty";
            empty.textContent = "Failed to load LoRAs";
            grid.appendChild(empty);
            console.error(error);
        }
    };

    const rerender = () => {
        countButton.textContent = String(state.selectedSet.size);
        renderGrid(state);
    };

    search.addEventListener("input", () => {
        state.query = search.value;
        rerender();
    });
    folderSelect.addEventListener("change", () => {
        state.folder = folderSelect.value;
        rerender();
    });
    clearButton.addEventListener("click", () => {
        state.selectedSet.clear();
        saveSelected(node, [], state.items, state.selectedPrompts);
        rerender();
    });
    batchUploadButton.addEventListener("click", () => batchUploadThumbnails(state));
    selectAllButton.addEventListener("click", () => {
        for (const item of getVisibleItems(state)) {
            state.selectedSet.add(item.name);
        }
        saveSelected(node, [...state.selectedSet], state.items, state.selectedPrompts);
        rerender();
    });
    refreshButton.addEventListener("click", () => reload(true));
    if (typeof node.addDOMWidget === "function") {
        const widget = node.addDOMWidget("lora_gallery", "lora_gallery", root, {
            serialize: false,
            hideOnZoom: false,
            getMinHeight: () => MIN_WIDGET_HEIGHT,
            getHeight: () => widgetSize.height,
        });
        widget.serialize = false;
        widget.computeSize = () => [widgetSize.width, widgetSize.height];
        widget.computeLayoutSize = () => ({
            minHeight: MIN_WIDGET_HEIGHT,
            minWidth: MIN_WIDGET_WIDTH,
        });
        if (typeof node.computeSize === "function") {
            const computedSize = node.computeSize();
            widgetSize.extraHeight = Math.max(NODE_EXTRA_HEIGHT, Math.round((computedSize?.[1] || 0) - widgetSize.height));
        }

        const originalOnResize = node.onResize;
        node.onResize = function (size) {
            const result = originalOnResize?.apply(this, arguments);
            applyNodeResize(size);
            this.setDirtyCanvas?.(true, true);
            return result;
        };
    } else {
        node.addWidget("button", "LoRA Gallery unavailable", null, () => reload(true));
    }

    setTimeout(() => reload(false), 0);
    setTimeout(() => syncNodeLayout(node, widgetSize), 0);
    return root;
}

app.registerExtension({
    name: EXTENSION_NAME,
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_NAME) {
            return;
        }

        const originalOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function (...args) {
            const result = originalOnNodeCreated?.apply(this, args);

            hideWidgetByName(this, "selected_loras");
            hideWidgetByName(this, "empty_behavior");
            createInlineGallery(this);

            this.resizable = true;
            
            return result;
        };
    },
});
