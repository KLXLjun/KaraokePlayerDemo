package main

import (
	"crypto/md5"
	"database/sql"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"

	_ "github.com/mattn/go-sqlite3"

	"github.com/bogem/id3v2"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type md5sql struct {
	md5str string
}

//ErrJSON 错误信息
type ErrJSON struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
}

//ListJSON 结果列表
type ListJSON struct {
	Code   int         `json:"code"`
	Length int         `json:"length"`
	Limit  int         `json:"limit"`
	Result *[]SongType `json:"result"`
}

//SongType 歌曲信息
//title,artist,album,localpath as music,lrclocalpath as lrc
type SongType struct {
	Title  string `json:"title"`
	Artist string `json:"artist"`
	Album  string `json:"album"`
	Music  string `json:"music"`
	Lrc    string `json:"lrc"`
}

var db *sql.DB
var errdb error
var songcount int = 0
var databaselock = false
var dbfilePath = "./songlist.db" //数据库位置

//在这里设置默认值
const (
	defaultlimit = 20 //当访问时没有指定歌曲数,那么默认为20首
	defaultpage  = 0  //当访问时没有指定页数,那么默认为第0页
)

func main() {
	db, errdb = sql.Open("sqlite3", dbfilePath)
	if errdb != nil {
		fmt.Println(errdb)
		os.Exit(0)
	}

	//判断表是否存在
	var ishave int
	tableishave := db.QueryRow("SELECT count(*) from sqlite_master where type='table' and name='songlist'")
	tableishaveerr := tableishave.Scan(&ishave)
	if tableishaveerr != nil {
		log.Println("数据库执行错误")
		os.Exit(0)
	}

	//没有表 则创建表
	if ishave == 0 {
		tablesql := `CREATE TABLE songlist (
			title        VARCHAR (64),
			artist       VARCHAR (64),
			album        VARCHAR (64),
			localpath    VARCHAR (64),
			lrclocalpath VARCHAR (64),
			md5          CHAR (32) 
		);`

		db.Exec(tablesql)
	}

	log.Println("Scanning songs...")
	//扫描本地歌曲
	scansong()
	log.Println("Scan complete!")

	e := echo.New()
	e.Use(middleware.GzipWithConfig(middleware.GzipConfig{
		Level: 5,
	}))

	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "${remote_ip} [${time_rfc3339}] ${method} ${status} ${latency_human} ${uri} ${user_agent}\n",
	}))

	e.Use(CORS)

	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello, World!")
	})

	e.Static("/music", "music")
	e.File("/player/", "./playerweb/index.html")
	e.Static("/player/*", "playerweb")

	//list 列表
	listGroup := e.Group("/list")
	listGroup.GET("/getlist", listget)   //获取 page=页数
	listGroup.GET("/reload", listreload) //刷新数据库
	log.Println("Service is Run!")
	e.Logger.Fatal(e.Start(":8080"))
}

func scansong() {
	databaselock = true
	files, err := ioutil.ReadDir("./music")
	if err != nil {
		log.Fatal(err)
	}

	stmt, err2 := db.Prepare("INSERT INTO songlist values(?,?,?,?,?,?)")
	if err2 != nil {
		fmt.Println(err2)
	}

	for _, file := range files {
		if !file.IsDir() {
			filename := file.Name()
			if HasSuffix(filename, ".mp3") {
				lrchave := false
				i := "./music/" + filename[:len(filename)-3] + "lrc"
				if FileisHave(i) {
					lrchave = true
				}

				if !lrchave {
					i = ""
				}

				tag, err := id3v2.Open("./music/"+filename, id3v2.Options{Parse: true})
				if err != nil {
					log.Fatal("Error while opening mp3 file: ", err)
				}
				defer tag.Close()

				md5s := MD5Enc("music/" + filename)

				ui := new(md5sql)
				row := db.QueryRow("select md5 from songlist where md5=?", md5s)
				errx := row.Scan(&ui.md5str)
				if errx != nil && errx == sql.ErrNoRows { //没有这一行
					if len(tag.Title()) < 1 {
						stmt.Exec(filename[:len(filename)-4], tag.Artist(), tag.Album(), "music/"+filename, "music/"+filename[:len(filename)-3]+"lrc", md5s)
					} else {
						stmt.Exec(tag.Title(), tag.Artist(), tag.Album(), "music/"+filename, "music/"+filename[:len(filename)-3]+"lrc", md5s)
					}
					//log.Println(tag.Title(), tag.Artist(), tag.Album(), "music/"+filename, "music/"+filename[:len(filename)-3]+"lrc", md5s)
					continue
				}
				//log.Println("数据库存在,跳过")
			}
		}
	}

	defer stmt.Close()

	//select count(*) as songlength from songlist
	cut := db.QueryRow("select count(*) as songlength from songlist")
	counterr := cut.Scan(&songcount)
	if counterr != nil {
		songcount = 0
		log.Println("列出数量错误")
	}
	databaselock = false
	log.Println("数据库准备就绪")
}

func listget(c echo.Context) error {
	if databaselock {
		u := map[string]interface{}{
			"code": "-105",
			"msg":  "数据库正在刷新数据",
		}
		return c.JSON(http.StatusForbidden, u)
	}
	pages := c.QueryParam("page")
	limits := c.QueryParam("limit")

	page, pageerr := strconv.ParseInt(pages, 10, 64)
	if pageerr != nil {
		page = defaultpage
	}
	limit, limiterr := strconv.ParseInt(limits, 10, 64)
	if limiterr != nil {
		limit = defaultlimit
	}

	page = page * limit

	selectresult, selectsqlerr := db.Query("select title,artist,album,localpath as music,lrclocalpath as lrc from songlist limit ?,?", page, limit)
	defer selectresult.Close()

	if selectsqlerr != nil {
		log.Println(selectsqlerr)
		u := map[string]interface{}{
			"code": "-101",
			"msg":  "搜索数据库错误",
		}
		return c.JSON(http.StatusForbidden, u)
	}
	rsarr := make([]SongType, 0)

	for selectresult.Next() {
		tmp1 := new(SongType)
		scanerr := selectresult.Scan(&tmp1.Title, &tmp1.Artist, &tmp1.Album, &tmp1.Music, &tmp1.Lrc)
		if scanerr != nil {

		}
		tmp1.Music = "/" + tmp1.Music
		tmp1.Lrc = "/" + tmp1.Lrc
		rsarr = append(rsarr, *tmp1)
	}

	tmp2 := new(ListJSON)
	tmp2.Code = 200
	tmp2.Length = songcount
	tmp2.Limit = defaultlimit
	tmp2.Result = &rsarr

	return c.JSON(http.StatusOK, tmp2)
}

func listreload(c echo.Context) error {
	scansong()
	u := map[string]interface{}{
		"code": "200",
		"msg":  "执行成功,数据库已刷新",
	}
	return c.JSON(http.StatusOK, u)
}

//HasSuffix 字符串s中是否以suffix为后缀
func HasSuffix(s, suffix string) bool {
	return len(s) >= len(suffix) && s[len(s)-len(suffix):] == suffix
}

//FileisHave 文件是否存在
func FileisHave(s string) bool {
	rs := false
	_, err := os.Stat(s)
	if err != nil {
		if os.IsNotExist(err) {
			rs = false
		} else {
			rs = true
		}
	} else {
		rs = true
	}
	return rs
}

//MD5Enc 对字符串进行MD5哈希
func MD5Enc(data string) string {
	t := md5.New()
	io.WriteString(t, data)
	return fmt.Sprintf("%x", t.Sum(nil))
}

//CORS 跨域
func CORS(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		c.Response().Header().Set("Access-Control-Allow-Headers", "*")
		c.Response().Header().Set("Access-Control-Allow-Origin", "*")
		c.Response().Header().Set("Access-Control-Request-Method", "*")
		return next(c)
	}
}
