# ComfyUI LoRA Visual Selector

一个可视化 LoRA 选择节点：节点外面默认显示 LoRA 图库，给每个 LoRA 上传示例图后，可以直接在卡片右上角勾选。勾选多个 LoRA 时，节点会输出多组 `MODEL` / `CLIP`，下游采样节点会按 LoRA 列表生成多张图。

## 安装

把本文件夹放到：

```text
ComfyUI/custom_nodes/comfyui-lora-Management
```

然后重启 ComfyUI。

## 使用

1. 添加节点：`loaders/lora -> LoRA Visual Selector`。
2. 把 `Load Checkpoint` 的 `MODEL` 和 `CLIP` 接到此节点。
3. 在节点里直接搜索、上传示例图、勾选 LoRA。
4. 把此节点输出的 `model` / `clip` 接到后面的 `CLIP Text Encode`、`KSampler` 等节点。

`strength_model` 和 `strength_clip` 是全局强度，默认分别为 `0.85` 和 `1.0`。如果没有勾选 LoRA，节点会直接输出原模型和原 CLIP。

## 缩略图位置

上传的示例图保存在本扩展目录下：

```text
thumbnails/lora_visual_selector
```

删除这里的图片不会影响 LoRA 文件本身。
