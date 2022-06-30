package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"time"

	"github.com/bogem/id3v2"
)

//SongType 歌曲信息
type SongType struct {
	Title  string `json:"title"`
	Artist string `json:"artist"`
	Album  string `json:"album"`
	Music  string `json:"music"`
	Lrc    string `json:"lrc"`
}

func main() {
	log.Println("Scanning songs...")
	scansong()
	log.Println("Scan complete!")
}

func scansong() {
	result := make([]SongType, 0)
	files, err := ioutil.ReadDir("./music")
	if err != nil {
		log.Fatal(err)
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

				tmp := SongType{}
				if len(tag.Title()) < 1 {
					tmp.Title = filename[:len(filename)-4]
					tmp.Artist = tag.Artist()
					tmp.Album = tag.Album()
					tmp.Music = "music/" + filename
					tmp.Lrc = "music/" + filename[:len(filename)-3] + "lrc"
				} else {
					tmp.Title = tag.Title()
					tmp.Artist = tag.Artist()
					tmp.Album = tag.Album()
					tmp.Music = "music/" + filename
					tmp.Lrc = "music/" + filename[:len(filename)-3] + "lrc"
				}
				result = append(result, tmp)
			}
		}
	}

	b, err := json.Marshal(result)
	if err != nil {
		fmt.Println("JSON ERR:", err)
	}
	rs := save(b)
	if rs != nil {
		log.Println("发生了错误", rs)
	}
}

func save(input []byte) error {
	FileErr := os.Remove("./song.json")
	if os.IsNotExist(FileErr) || FileErr == nil {
		time.Sleep(500)
		file1, err5 := os.Create("./song.json")
		defer file1.Close()
		if err5 != nil {
			return err5
		}
		file1.Write(input)
		return nil
	}
	return FileErr
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
