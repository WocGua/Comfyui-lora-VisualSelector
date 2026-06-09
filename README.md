# ComfyUI LoRA Visual Selector

一个可视化 LoRA 选择节点：节点外面默认显示 LoRA 图库，给每个 LoRA 上传示例图后，可以直接在卡片右上角勾选。勾选多个 LoRA 时，节点会输出多组 `MODEL` / `CLIP`，下游采样节点会按 LoRA 列表生成多张图。

## 安装

把本文件夹放到：

```text
ComfyUI/custom_nodes
```

然后重启 ComfyUI。

## 使用

1. 添加节点：`loaders/lora -> LoRA Visual Selector`。

## 缩略图位置

上传的示例图保存在本扩展目录下：

```text
thumbnails/lora_visual_selector
```





<img width="840" height="1060" alt="a5cef35e-6c62-4fd6-a1f2-783cfa47da08" src="https://github.com/user-attachments/assets/11b1f821-bdb8-45a5-93b9-d56edd0dd6a7" />
