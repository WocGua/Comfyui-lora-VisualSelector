# ComfyUI LoRA Visual Selector

一个可视化 LoRA 选择节点：节点外面默认显示 LoRA 图库，给每个 LoRA 上传示例图后，可以直接在卡片右上角勾选。勾选多个 LoRA 时，节点会输出多组 `MODEL` / `CLIP` / `lora_name` / `lora_prompt`，下游采样节点会按 LoRA 列表生成多张图。

## 功能

- 可视化 LoRA 网格：在节点内直接浏览、搜索和选择 LoRA。
- 文件夹筛选：按 `models/loras` 下的子目录快速过滤 LoRA。
- 全选可见项：一键选中当前搜索/文件夹筛选结果。
- 单张缩略图上传：给单个 LoRA 绑定预览图。
- 批量缩略图导入：一次选择多张图片，按文件名自动匹配 LoRA。
- 内置 Prompt / 触发词：每个 LoRA 可保存独立提示词，并通过 `lora_prompt` 输出。
- 可拉伸图库：节点大小可拖拽调整，图库区域会跟随变大或变小。

## 安装

把本文件夹放到：

```text
ComfyUI/custom_nodes
```

然后重启 ComfyUI。

## 使用

1. 添加节点：`loaders/lora -> LoRA Visual Selector`。
2. 在图库里搜索、筛选、勾选 LoRA。
3. 点击卡片上的 `Upload` 上传单个缩略图。
4. 点击工具栏的 `↑` 批量导入缩略图。
5. 点击卡片上的 `P` 为 LoRA 添加或编辑内置 Prompt / 触发词。
6. 拖拽节点右下角可以调整图库显示区域。

## 缩略图位置

上传的示例图保存在本扩展目录下：

```text
thumbnails/lora_visual_selector
```

## Prompt 保存位置

内置 Prompt / 触发词保存在本扩展目录下：

```text
metadata/lora_prompts.json
```





<img width="840" height="1060" alt="a5cef35e-6c62-4fd6-a1f2-783cfa47da08" src="https://github.com/user-attachments/assets/11b1f821-bdb8-45a5-93b9-d56edd0dd6a7" />
