<p align="center">
  <img src="https://raw.githubusercontent.com/NewtNorlly/Mon-Mode-de-Vie/main/assets/avatars/host-mooncat.png" width="96" alt="" />
</p>

<h1 align="center">Mon Mode de Vie</h1>

<p align="center">
  <em>「盈缩之期，不但在天；养怡之福，可得永年。」</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-evergreen-brightgreen" alt="" />
  <img src="https://img.shields.io/badge/languages-4-6e5494" alt="" />
  <img src="https://img.shields.io/badge/themes-9-e8a838" alt="" />
  <img src="https://img.shields.io/badge/deployed-GitHub_Pages-222222" alt="" />
</p>

<br />

> 每个人的生活都值得一间会客厅。  
> 一角放日历，一角放日记；  
> 墙上挂着去过的地方，唱片机里转着喜欢的声音；  
> 朋友来了推开左栏，翻开某年今日，煮一壶茶。

---

### 🐼 这是什么

一个纯粹的个人生活空间。不是博客，不是社交媒体，不是待办清单。

它是濂溪区某个夏天里，每天打开电脑最想看到的东西。

九个主题色卡、四种语言、二十多篇日记、七个相册、一个慢慢转的黑胶唱片。一间会客厅，左边是「去年今日」，右边是留言，中间是日历、日记、相册，顶上飘着一朵可以随时拉开的小云——换主题、切语言、读一封信。

---

### 🗂️ 模块

| 🐼 | 会客厅 | 进门就是。聊天、茶话、纪念日故事，像有人拉开椅子说「你先坐」 |
| 🗓️ | 日历 | 年视图到日视图，吃·学·教·玩·做·歇六色标记 |
| 📝 | 日记 | 二十多篇四语日记，插图全语言嵌入，最新的日子在最上面 |
| 🏔️ | 相册 | 七个固定分册，不增不减，只往里放照片 |
| 🍃 | 小云 | 切主题、换语言、明暗模式、一封信、音乐盒，都在这里面 |

---

### 🎨 主题色卡

`妮珂` `石墨` `柑橘` `湖绿` `莺紫` `钴蓝` `薰衣草` `陶土` `🐼熊猫`

熊猫主题比较特别——导航栏的 SVG 图标会变成 Emoji，左右栏按钮变成小脚印 🐾。切换瞬间完成，零闪烁。

---

### 🎵 音乐盒

左栏嵌了一个迷你唱片机。播放的时候黑胶盘会慢慢转，五根波形条跟着跳。当前的曲子是 Мельница 的《Белая кошка》。

想换歌？打开 `智能体操作手册.md`，里面有标准流程。

---

### 🌍 四语

```
會客廳  ·  Living Room  ·  Salon  ·  Wohnzimmer
日  曆  ·  Calendar      ·  Calendrier  ·  Kalender
日  記  ·  Journal       ·  Journal     ·  Tagebuch
相  冊  ·  Album         ·  Album       ·  Album
```

日记正文同样是四语。切语言不需要刷新页面，所有插图、alt、caption 同步切换。

---

### 📦 技术栈

<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="" />
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white" alt="" />
  <img src="https://img.shields.io/badge/TOAST_UI_Calendar-1.13-515ce6?style=flat-square" alt="" />
</p>

纯前端，无框架，无构建工具。CSS 自定义属性驱动九套主题，`data-theme` 属性一次切换全站。GitHub Actions 自动部署到 Pages，push 即上线。

---

### 🚀 本地运行

```bash
# 启动开发服务器（端口 4174）
启动网站.cmd

# 或手动指定端口
powershell -NoProfile -ExecutionPolicy Bypass -File "tools\serve-local.ps1" -Port 4180
```

打开 `http://localhost:4174/` 即可。

---

### 🤖 智能体操作手册

项目配备了完整的 `智能体操作手册.md`，涵盖：

- 添加日记（有插图 / 无插图两种流程）
- 四语插图强制规则
- 纪念日茶话日期索引管理
- 去年今日卡片联动更新
- 音乐盒歌曲更换
- 一封信作者留言修改
- 日历日程增删改
- 相册照片管理
- 主题与样式调整

所有操作均有标准流程、数据文件路径和提交规范。

---

### 📊 数字

```
日记  25 篇（四语 + 插图）
相册   7 个分册
主题   9 套色卡
语言   4 种
内容 277+ 项
```

---

### 📄 协议

MIT License

---

<p align="center">
  <br />
  <em>「多做一些朝花夕拾的事，少做一些半途而废的事。」</em>
  <br /><br />
  Made with ☕ in Lianxi, Jiujiang
</p>
