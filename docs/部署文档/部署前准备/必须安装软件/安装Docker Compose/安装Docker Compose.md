# 安装Docker Compose

## 方式一：安装 Docker Compose V2（官方插件）

执行：

```
sudo apt update
sudo apt install -y docker-compose-plugin
```

------

验证是否安装成功

执行：

```
docker compose version
```

如果输出类似：

```
Docker Compose version v2.x.x
```

👉 说明 V2 已安装成功 ✅

❗问题本质

你执行：

```
sudo apt install -y docker-compose-plugin
```

报错：

```
The repository 'https://download.docker.com/linux/ubuntu focal Release' no longer has a Release file.
```

👉 说明：

> ❌ Docker 官方 apt 源不可用 / 配置有问题 / 网络或 TLS handshake 失败

------

🧠 常见原因

可能是：

1. 国内网络访问 Docker 官方源失败（最常见）
2. Docker 源配置损坏
3. TLS handshake 被阻断
4. 源地址仍指向旧配置

确认原因： 国内网络无法正常访问 Docker 官方源（TLS 被阻断/超时）



## 方式二：手动安装 Docker Compose V2（推荐当前最快方案）

✅ 第一步：创建插件目录

```
mkdir -p ~/.docker/cli-plugins
```

------

✅ 第二步：下载 Compose V2 二进制文件

```
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
```

> ⚠️ 如果这个下载慢/失败，可以用我后面给你的备用方案

------

✅ 第三步：赋予执行权限

```
chmod +x ~/.docker/cli-plugins/docker-compose
```

------

✅ 第四步：验证安装

```
docker compose version
```

如果看到类似：

```
Docker Compose version v2.x.x
```

👉 说明安装成功 ✅



出现错误：你的服务器无法直接访问 GitHub（网络被限制/超时）



## 方式三：用“本地下载 + 上传服务器”方式安装 Compose V2

如果你是 Windows（推荐用 PowerShell）

打开 **PowerShell**，执行：

```
Invoke-WebRequest -Uri https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -OutFile docker-compose-linux-x86_64
```

------

下载完成后你会得到一个文件

文件名：

```
docker-compose-linux-x86_64
```

文件默认下载到了**当前 PowerShell 所在目录**。

你现在的位置是：

```
C:\WINDOWS\system32
```

所以文件就在这里👇

```
C:\WINDOWS\system32\docker-compose-linux-x86_64
```



我已经下载完了路径：D:\MyProject\Planning-app\docs\部署文档\部署前必须软件\安装Docker Compose\docker-compose-linux-x86_64



用 FinalShell（最推荐，最简单）拖拽文件”docker-compose-linux-x86_64“到服务器

步骤：

1. 打开 FinalShell
2. 连接你的服务器
3. 左侧找到你本地文件（桌面）（docker-compose-linux-x86_64文件， 我放入桌面了）

路径类似：

```
C:\Users\你的用户名\Desktop\
```

1. 找到文件：

```
docker-compose-linux-x86_64
```

1. **直接拖到服务器右侧目录（如 /home/ubuntu）**

------

上传完成后，在服务器执行：

```
mkdir -p ~/.docker/cli-plugins
mv ~/docker-compose-linux-x86_64 ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose
```

验证：

```
docker compose version
```

Docker Compose version v5.1.0