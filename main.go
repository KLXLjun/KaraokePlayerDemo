package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path"
	"strings"
	"time"

	"github.com/bogem/id3v2"
)

//SongType 歌曲信息
type SongType struct {
	Title   string `json:"title"`
	Artist  string `json:"artist"`
	Album   string `json:"album"`
	Music   string `json:"music"`
	Lrc     string `json:"lrc"`
	Picture string `json:"picture"`
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
				fileNameOnly := strings.TrimSuffix(filename, path.Ext(filename))
				lrchave := false
				i := "./music/" + fileNameOnly + ".lrc"
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

				havepic := false
				pictures := tag.GetFrames(tag.CommonID("Attached picture"))
				for _, f := range pictures {
					pic, ok := f.(id3v2.PictureFrame)
					if !ok {
						log.Fatal("Couldn't assert picture frame")
					}
					spic(pic.Picture, fileNameOnly+".png")
					havepic = true
				}

				tmp := SongType{}
				if len(tag.Title()) < 1 {
					tmp.Title = filename[:len(filename)-4]
					tmp.Artist = tag.Artist()
					tmp.Album = tag.Album()
				} else {
					tmp.Title = tag.Title()
					tmp.Artist = tag.Artist()
					tmp.Album = tag.Album()
				}
				tmp.Music = "music/" + filename
				tmp.Lrc = "music/" + fileNameOnly + ".lrc"
				if havepic {
					tmp.Picture = fileNameOnly + ".png"
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

func spic(input []byte, path string) error {
	FileErr := os.Remove("./music/" + path)
	if os.IsNotExist(FileErr) || FileErr == nil {
		time.Sleep(500)
		file1, err5 := os.Create("./music/" + path)
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
