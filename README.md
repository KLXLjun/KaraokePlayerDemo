# KaraokePlayerDemo

卡拉ok的demo,这个还不是完成品!

现在只是写好了,后续我还会继续优化

如果有问题或者bug,请开一个新的issues!

演示地址(使用了cloudflare): https://demo.huyaoi.moe/karaokeplayerdemo/

*注意:在本项目Demo中,如果演示歌曲侵权,请与我联系,我会将其删除

# 简述
在项目的player文件夹的music文件夹内放入音乐文件和歌词文件(对应的文件需要同名!),启动player文件夹内程序SongListGenerate.exe(如果不存在,请自行生成!)以生成列表文件.

然后将player文件夹放置在服务器里,预览即可

# 使用方法

在启动后,界面应该是这样的

![预览](https://github.com/KLXLjun/KaraokePlayerDemo/blob/main/image/20220814013958.jpg)

底部控制栏分为:播放,暂停,停止(还没做),设置,音量,待播放列表,所有歌曲

在所有歌曲里选择歌曲,选择歌曲后将会加入到待播放列表.

在待播放列表里选择你加入的歌曲,即可播放.

*在待播放列表里可以拖拽,切换顺序,并且可以添加多个同名歌曲

# 工具运行需求
go 版本 1.14

# 工具运行方法
在项目根目录打开命令提示符(或是PowerShell)输入
```
go run .\main.go
```
