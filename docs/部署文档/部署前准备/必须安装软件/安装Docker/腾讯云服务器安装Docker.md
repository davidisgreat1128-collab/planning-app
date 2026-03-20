



# 一、腾讯云服务器安装 Docker（推荐方式）

假设你的服务器是 **Ubuntu 20/22**（腾讯云最常见）。

## 1 更新系统

先更新系统软件包：

```
sudo apt update
sudo apt upgrade -y
```

------

## 2 安装必要依赖

```
sudo apt install -y ca-certificates curl gnupg lsb-release
```

这些包用于下载 Docker 官方仓库密钥。 

------

## 3 添加 Docker 官方 GPG 密钥

```
sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

------

## 4 添加 Docker 仓库

```
echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

------

## 5 安装 Docker

```
sudo apt update

sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin


```

------

####  注意

```
注意 有时候执行安装Docker命令（上述指令）会失败
Could not handshake: Error in the pull function
containerd.io 下载失败

这在国内服务器 非常常见，原因通常是：

Docker 官方源网络波动

TLS握手失败

CDN节点不稳定

不是你的操作问题 👍
```



## 6 启动 Docker

```
//立即启动 Docker 服务
sudo systemctl start docker
//设置开机自动启动
sudo systemctl enable docker
```

------

## 7 测试 Docker 是否正常（在国内，先做配置 Docker 镜像加速）

```
docker --version
```

再运行测试容器：

```
sudo docker run hello-world
```

如果出现：

```
Hello from Docker!
```

说明安装成功。

------

# 二、腾讯云服务器必须做的优化（非常重要）

腾讯云服务器如果不做这些优化，**Docker 会很慢或者拉不下来镜像**。

## 1 配置 Docker 镜像加速（强烈推荐）

因为 Docker Hub 在国外。

编辑配置文件：

```
sudo mkdir -p /etc/docker

sudo nano /etc/docker/daemon.json

```

上两行命令的解释：

```
1️⃣ sudo mkdir -p /etc/docker

意思：在 Linux 系统里创建一个目录 /etc/docker

参数解释：

sudo：以管理员权限执行，因为 /etc 是系统目录，普通用户没有写权限

mkdir：make directory，创建目录

-p：如果上级目录不存在就自动创建，同时不会报错

为什么要做这步：
Docker 的配置文件默认放在 /etc/docker/daemon.json，所以必须先确保 /etc/docker 这个目录存在。

2️⃣ sudo nano /etc/docker/daemon.json

意思：用 nano 编辑器 创建或编辑 Docker 的配置文件 daemon.json

参数解释：

sudo：以管理员权限编辑系统文件

nano：Linux 的命令行文本编辑器

/etc/docker/daemon.json：Docker 的主配置文件

为什么要做这步：
你需要在这个文件里写入 Docker 镜像加速器配置，让 Docker 在国内环境能快速拉取镜像，例如：

{
  "registry-mirrors": ["https://<你的阿里云加速器ID>.mirror.aliyuncs.com"]
}

写完后，按 Ctrl + O 保存，再按 Ctrl + X 退出 nano 编辑器。


```



填入：

```
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com"
  ]
}
//（写完后 按 Ctrl + O 保存，再按 Ctrl + X 退出 nano 编辑器）
```

这是腾讯云官方镜像加速地址。

然后重启：

```
sudo systemctl daemon-reload
sudo systemctl restart docker
```

------

## 2 允许普通用户使用 Docker（推荐）

否则每次都要 sudo。

```
sudo usermod -aG docker $USER
```

然后重新登录服务器。

测试：

```
docker ps
```

------

# 三、腾讯云服务器部署 Docker 的注意事项

### 1 系统必须是 64位

Docker 只支持：

- 64位系统
- Linux Kernel ≥ 3.10 

------

### 2 Windows 云服务器不能跑 Linux Docker

腾讯云 Windows 服务器：

❌ 不支持 Docker Desktop
 ❌ 不支持 WSL Docker

因为云服务器 **不支持嵌套虚拟化**。 

所以必须用：

✔ Linux服务器

------

### 3 系统盘建议 ≥ 50GB

Docker镜像会占空间，例如：

- MySQL
- Redis
- Nginx
- AI模型

腾讯云官方建议：

> Docker服务器磁盘 ≥ 100GB更合适。 

------

### 4 Docker 默认端口要开放

例如：

| 服务    | 端口 |
| ------- | ---- |
| Nginx   | 80   |
| HTTPS   | 443  |
| MySQL   | 3306 |
| Redis   | 6379 |
| APP API | 8080 |

需要在 **腾讯云安全组开放**。

------

# 四、Docker安装完成后常用命令

### 查看容器

```
docker ps
```

------

### 查看镜像

```
docker images
```

------

### 运行 nginx

```
docker run -d -p 80:80 nginx
```

浏览器访问服务器 IP 即可。

------

# 五、Docker在你项目里的作用（非常重要）

根据你之前说的：

你要部署

- APP后台
- OpenClaw
- 数据库

Docker可以这样部署：

```
服务器
 │
 ├─ Docker
 │
 ├─ nginx容器
 ├─ mysql容器
 ├─ redis容器
 ├─ app后台容器
 └─ AI服务容器
```

优点：

- 不污染系统
- 部署快
- 可以随时重建
- 一条命令升级

------

# 六、给你的服务器部署建议（非常关键）

根据你之前的项目：

> 2个APP后台 + AI接口

建议 Docker 架构：

```
服务器
│
├─ Docker
│
├─ Nginx
├─ MySQL
├─ Redis
├─ App后台1
├─ App后台2
└─ AI服务
```

------

# 七、新手最容易踩的坑（我提前帮你避开）

1️⃣ Docker安装成功但不能运行
 原因：没启动

```
sudo systemctl start docker
```

------

2️⃣ docker命令没权限

```
permission denied
```

解决：

```
sudo usermod -aG docker $USER
```

------

3️⃣ Docker拉镜像慢

解决：

配置 **腾讯云镜像源**

------

4️⃣ 服务器磁盘爆满

解决：

```
docker system prune -a
```

------

# 八、如果你愿意，我可以给你一套 **腾讯云服务器完整部署架构**

我可以直接帮你规划：

从 **0 到完整上线**

```
腾讯云服务器
↓
Docker
↓
Nginx
↓
APP后台
↓
MySQL
↓
Redis
↓
AI接口
```

我还可以给你一份 **新手级完整部署手册（一步一步命令）**，很多做 APP 的团队都用这套。