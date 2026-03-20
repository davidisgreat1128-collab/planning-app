

# 安装Certbot

可以 👍 我带你在 Ubuntu 服务器上安装 **Certbot（用于申请 HTTPS 证书）**。

------

# 🧠 一、Certbot 是什么？

Certbot 是一个自动化工具，用来：

- 申请 SSL/TLS 证书（HTTPS）
- 自动续期证书
- 配合 Nginx / Apache 使用

👉 常用于给你的域名开启 HTTPS

------

# ✅ 二、安装 Certbot（推荐方式）

在 Ubuntu 20.04 上，建议使用 apt：

## 1️⃣ 更新软件源

```
sudo apt update


```

```
https://download.docker.com/linux/ubuntu focal

错误：

Could not handshake: Error in the pull function

👉 含义是：

❌ 服务器无法正常访问 Docker 官方仓库（网络问题 / TLS 握手失败）
❌ apt 认为该源不安全 → 自动禁用

解决方案：直接禁用 Docker 官方 apt 源（最简单）

既然你已经安装好了 Docker，可以直接移除这个源：

sudo rm /etc/apt/sources.list.d/docker.list

然后再执行：

sudo apt update

👉 报错就会消失 ✅
```



------





## 2️⃣ 安装 Certbot + Nginx 插件

如果你后面用 Nginx（推荐）：

```
sudo apt install -y certbot python3-certbot-nginx
```

------

# ✅ 三、验证安装

```
certbot --version
```

------

# 🚀 四、如果你是用 Nginx（常见）

后面申请证书会用：

```
sudo certbot --nginx
```

它会自动：

- 识别你的域名
- 配置 HTTPS
- 修改 Nginx 配置
- 自动跳转 HTTP → HTTPS

------

# ⚠️ 五、使用 Certbot 前的前提

你需要满足：

- ✅ 有域名（例如你之前的 `txjjzyzqbx.cn`）
- ✅ 域名已解析到服务器 IP
- ✅ 服务器 80 / 443 端口开放
- ✅ Nginx 已安装并运行

------

# 🎯 总结

你现在只需要执行：

```
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
certbot --version
```