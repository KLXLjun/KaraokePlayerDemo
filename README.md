# KaraokePlayerDemo

卡拉ok的demo,这个还不是完成品!

现在只是写好了,后续我还会继续优化

如果有问题或者bug,请开一个新的issues!

# 简述
在项目的player文件夹的music文件夹内放入音乐文件和歌词文件(对应的文件需要同名!),启动player文件夹内程序SongListGenerate.exe(如果不存在,请自行生成!),将生成的song.json(歌曲列表)文件移入playerweb内.

然后将playerweb放置在服务器里,预览即可

请注意,使用项目时,需要浏览器支持离屏渲染(OffscreenCanvas)!

# 工具运行需求
go 版本 1.14

# 工具运行方法
在项目根目录打开命令提示符(或是PowerShell)输入
```
go run .\main.go
```
