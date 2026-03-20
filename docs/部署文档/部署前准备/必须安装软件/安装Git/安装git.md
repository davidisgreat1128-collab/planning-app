# 安装git

## ✅ 一、更新软件源（建议先做）

```
sudo apt update
```

------

## ✅ 二、安装 Git

```
sudo apt install -y git
```

------

## ✅ 三、验证是否安装成功

```
git --version
```

👉 正常会输出类似：

```
git version 2.xx.x
```

------

## ✅ 四、基础配置（建议做）

安装完建议配置你的身份信息（用于提交代码）：

```
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

查看配置：

```
git config --list
```

------

## 🎯 总结

你只需要执行三步核心命令：

```
sudo apt update
sudo apt install -y git
git --version
```

------

如果你接下来要做项目部署（比如 Planning App）：

```
ubuntu@VM-0-10-ubuntu:~$ git config --global user.name "David"&& git config --global user.email "davidisgreat1128@gmail.com"
ubuntu@VM-0-10-ubuntu:~$ git config --list
user.name=David
user.email=davidisgreat1128@gmail.com
ubuntu@VM-0-10-ubuntu:~$ 
```

